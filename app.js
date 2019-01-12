//external packages
const fs = require('fs');
const _ = require('lodash');
const yargs = require('yargs');

// internal packages
const bible = require('./bible.js');
const bible_books = bible.bible_books;
const bible_structure = bible.bible_structure;

// Variable set up
var theBible = JSON.parse(fs.readFileSync('niv_bible.json'));
var verseArray = {};

// formatting  funtions
function toTitleCase(str) {
    return str.replace(
        /\w\S*/g,
        function(txt) {
            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        }
    );
}

// section gets the input verse 
var verseInput = yargs
.command('json','Find a verse from the NIV Bible and return verse in JSON format', {
    verse: {
        decribe: 'input the verse you want to find',
        demand: true,
        alias: 'v'
    }
})
.command('html','Find a verse from the NIV Bible and returns verse in Full HTML format', {
    verse: {
        decribe: 'input the verse you want to find',
        demand: true,
        alias: 'v'
    }
})
.command('html_lite','Find a verse from the NIV Bible and returns verse in lite HTML format', {
    verse: {
        decribe: 'input the verse you want to find',
        demand: true,
        alias: 'v'
    }
})
.command('plain','Find a verse from the NIV Bible and returns verse in plain text', {
    verse: {
        decribe: 'input the verse you want to find',
        demand: true,
        alias: 'v'
    }
})
.help()
.argv;

// checks to if the user used the long or alias input
function getInput(input){
    input = input.verse || input.v;
    return input;
}

// Format the verse input
function splitAndTrim(verse, spliter, limit){ 
    var v = verse.split(spliter, limit);
    v[0] = v[0].trim();
    v[1] = v[1].trim();
    return v;
}

function startWithNum(verseInput){
    var part = splitAndTrim(verseInput, " ", 3)
    part[1] = toTitleCase(part[1]);
    book = bookToNum(bible_books, `${part[0]} ${part[1]}` );
    var res2 = splitAndTrim(part[2], ":", 3)
    chpt = res2[0];
    verse = res2[1];
    var output =  {
        book:book,
        chpt:Number(chpt),
        verse:Number(verse)
    };
    return output;
}

function bookToNum(bible_books, book){
    for(var key in bible_books) {
        if(bible_books[key] === book) {
            var theKey = key;
        }
    }
    return Number(theKey);
}

function numToBook(bible_books, num){
    return bible_books[num];
}

function getChptLength(book){
    return Object.keys(bible_structure[book]).length
}

function getVerseLength(book, chpt){
    return bible_structure[book][chpt];
}

function booksToNames(finalArray){
    for (elem in finalArray) {
        console.log(numToBook(bible_books, elem));
        let bookName = numToBook(bible_books, elem);
        finalArray[bookName] = finalArray[elem];  
        delete finalArray[elem];
    }
    return finalArray;
}

function formatVerse(verseInput) {
    var verseArray = {
        bookFrom:'',
        chptFrom:'',
        verseFrom:'',
        bookTo:'',
        chptTo:'',
        verseTo:''
    };
    if(verseInput.includes("-")) {
        // input has from and to verses
        var verseInput = splitAndTrim(verseInput, "-", 2)

        if(verseInput[0].startsWith('1')  || verseInput[0].startsWith('2') || verseInput[0].startsWith('3') ) {
            var from = startWithNum(verseInput[0]);
            verseArray.bookFrom = from.book;
            verseArray.chptFrom = from.chpt;
            verseArray.verseFrom = from.verse;

        } else {
            var res = verseInput[0].split(" ", 2);
            var res2 = res[1].split(":", 2)
            verseArray.bookFrom = bookToNum(bible_books, toTitleCase(res[0]));
            verseArray.chptFrom = Number(res2[0]);
            verseArray.verseFrom = Number(res2[1]);
        }
        if (verseInput[1].length > 3 ){
            if(verseInput[1].startsWith('1')  || verseInput[1].startsWith('2') || verseInput[1].startsWith('3') ) {
                var to = startWithNum(verseInput[1]);
                verseArray.bookTo = to.book;
                verseArray.chptTo = to.chpt;
                verseArray.verseTo = to.verse;
        
            } else {
                var res = verseInput[1].split(" ", 2);
                var res2 = res[1].split(":", 2)
                verseArray.bookTo = bookToNum(bible_books, toTitleCase(res[0]));
                verseArray.chptTo = Number(res2[0]);
                verseArray.verseTo = Number(res2[1]);
            }
        } else {
            verseArray.bookTo = verseArray.bookFrom;
            verseArray.chptTo = verseArray.chptFrom;
            verseArray.verseTo = verseInput[1];
        }
    } else {
        // input only has one verse
        if(verseInput.startsWith('1') || verseInput.startsWith('2') || verseInput.startsWith('3')){
            var from = startWithNum(verseInput);
            verseArray.bookFrom = from.book;
            verseArray.chptFrom = from.chpt;
            verseArray.verseFrom = from.verse;
            verseArray.bookTo = verseArray.bookFrom;
            verseArray.chptTo = verseArray.chptFrom;
            verseArray.verseTo = verseArray.verseFrom;

        } else {
            // input only has one verse and book does not contain numbers
            var res = verseInput.split(" ", 2);
            var res2 = res[1].split(":", 2)
            verseArray.bookFrom = bookToNum(bible_books, toTitleCase(res[0]));
            verseArray.chptFrom = Number(res2[0]);
            verseArray.verseFrom = Number(res2[1]);
            verseArray.bookTo = verseArray.bookFrom;
            verseArray.chptTo = verseArray.chptFrom;
            verseArray.verseTo = verseArray.verseFrom;
        }
    }
        return verseArray;
};

// checks: in chapter, in book or multiple books, error
function checkInput(verseArray){
    if(verseArray.bookFrom === verseArray.bookTo && verseArray.chptFrom === verseArray.chptTo)  {
        checkCode = 0;
    } else if (verseArray.bookFrom === verseArray.bookTo) {
        checkCode = 1;
    } else if (verseArray.bookFrom < verseArray.bookTo) {
        checkCode = 2;
    } else {
        checkCode = 3;
    }
    return checkCode;
}

// create passage
function createPassage(verseArray, checkCode){
    if (checkCode === 0){
        var finalArray = {[verseArray.bookFrom]:{[verseArray.chptFrom]:{}}};
        for(let j = verseArray.verseFrom; j <= verseArray.verseTo; j++){
            finalArray[verseArray.bookFrom][verseArray.chptFrom][j] =  theBible[verseArray.bookFrom][verseArray.chptFrom][j];    
        }
    } else if (checkCode === 1) {
        finalArray = {[verseArray.bookFrom]:{}};
        for(let j = verseArray.chptFrom; j <= verseArray.chptTo; j++){
            if (j == verseArray.chptFrom) {
                var verseStart = verseArray.verseFrom;
                var verseLimit = getVerseLength(verseArray.bookFrom, j);
            } else if (j == verseArray.chptTo) {
                var verseStart = 1;
                var verseLimit = verseArray.verseTo;
            } else {
                var verseStart = 1;
                var verseLimit = getVerseLength(verseArray.bookFrom, j);        
            }
            finalArray[verseArray.bookFrom][j] = {};
            for(let k = verseStart; k <= verseLimit; k++){
                finalArray[verseArray.bookFrom][j][k] = theBible[verseArray.bookFrom][j][k];
            }
        }
    } else if (checkCode === 2) {
        var finalArray = {};
        for(let b = verseArray.bookFrom; b <= verseArray.bookTo; b++ ){
            finalArray[b] = {};
            let chptstart;
            let chptend;
            if(b == verseArray.bookFrom) {
                chptstart = verseArray.chptFrom;
                chptend = getChptLength(b);
            } else if (b == verseArray.bookTo) {
                chptstart = 1;
                chptend = verseArray.chptTo;
            } else { 
                chptstart = 1;
                chptend = getChptLength(b);
            }
            for (let c = chptstart; c <= chptend; c++){
                finalArray[b][c] = {};
                let versestart;
                let verseend;
                if(c == chptstart && b == verseArray.bookFrom) {
                    versestart = verseArray.verseFrom;
                    verseend = getVerseLength(b, c);
                } else if (c == chptend && b == verseArray.bookTo) {
                    versestart = 1;
                    verseend = verseArray.verseTo;
                } else { 
                    versestart = 1;
                    verseend = getVerseLength(b, c);
                }
                for (let v = versestart; v <= verseend; v++){
                    finalArray[b][c][v] = theBible[b][c][v];
                }
            }
        }
    } else if (checkCode === 3) {
        finalArray = String("unknown input, unable to find verse");
    }
    finalArray = booksToNames(finalArray);
    return finalArray
}



// -------------------------------------------------------------------------
// main process flow

// sets the user input 
var action = verseInput._[0];
var theverseinput = getInput(verseInput);
verseArray = formatVerse(theverseinput);
var checkCode = checkInput(verseArray);
console.log(checkCode);
console.log(verseArray);
var finalArray = createPassage(verseArray, checkCode);
// console.log(finalArray);

if(action === 'json') {
    console.log(`Hi i'm json.`);
    console.log(finalArray);
} else if (action === 'html') {
    console.log(`Hi i'm html.`);

} else if (action === 'html_lite') {
    console.log(`Hi i'm html lite.`);
    var html_lite = `<div class="passage_container"><div class="passage">`;
    for(b in finalArray){
        html_lite += `<div class="book_name">${b}</div>`;
        for(c in finalArray[b]){
            html_lite += `<div class_number="chpt">${c}</div><class="verse_text">`;
            for(v in finalArray[b][c]){
                html_lite += `<span class="verse_number">${v}</span>${finalArray[b][c][v]}`;
            }
        }
    }
    html_lite += `</div></div>`;
    html_lite += `<div class="verse_ref">${numToBook(bible_books, verseArray.bookFrom)} ${verseArray.chptFrom}:${verseArray.verseFrom} - ${numToBook(bible_books,verseArray.bookTo)} ${verseArray.chptTo}:${verseArray.verseTo} NIV</div></div>`;
    console.log(html_lite);
} else if (action === 'plain') {
    console.log(`Hi i'm plain.`);
    // finalArray = booksToNames(finalArray);
    var plaintext;
    for(b in finalArray){
        for(c in finalArray[b]){
            for(v in finalArray[b][c]){
                plaintext += finalArray[b][c][v];
            }
        }
    }
    plaintext += `\n ${numToBook(bible_books, verseArray.bookFrom)} ${verseArray.chptFrom}:${verseArray.verseFrom} - ${numToBook(bible_books,verseArray.bookTo)} ${verseArray.chptTo}:${verseArray.verseTo} NIV`
    console.log(plaintext);
} else {
    console.log('Command not recognised');
} 




