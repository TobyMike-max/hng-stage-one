const express = require("express")
const crypto = require("crypto")


const app = express()
app.use(express.json()); // Parse JSON bodies
var unique = 0

let string = []

function palindrome(str) {
    end = str.length - 1
    for(i=0; i<str.length; i++) {
        if (str[i] == str[end]) {
            end--;
        }
        else return false
    }
    return true;
}

function character(str) {
    // Removes all occurence of whitespace
    remove_str = str.replace(/\s+/g, "")
    obj = {}
    for(let char of remove_str) {
        if (obj[char]) {
            obj[char]++;
        } else {
            obj[char] = 1;
        }
    }
    return obj
}

function string_analyzer(str){
    return {
        id: "sha256_hash_value",
        value: str,
        proprties: {
            length: str.length,
            is_palindrome: palindrome(str),
            unique_characters: Object.values(character(str)).forEach(value => {if (value == 1) unique++; return unique}),
            word_count: str.split(' ').length,
            sha256_hash: "abc123",
            character_frequency_map: character(str)
    },
    created_at: new Date().toISOString()
}}

// POST /strings endpoint
app.post("/strings", (req, res) => {
    str = req.params
    result = string_analyzer(str)
    res.status(201).json(result)
})


// GET /strings/{string_value} endpoint
app.get("/strings/${}", (req, res) => {
    
    res.status(200).json(
       string_analyzer(req.params)
    )
})


// GET /strings?is_palindrome=true&min_length=5&max_length=20&word_count=2&contains_character=a
app.get("/strings?is_palindrome=true&min_length=5&max_length=20&word_count=2&contains_character=a", (req, res) => {

})


// GET /strings/filter-by-natural-language?query=all%20single%20word%20palindromic%20strings
app.get("/strings/filter-by-natural-language?query=all%20single%20word%20palindromic%20strings", (req, res) => {

})

// DELETE /string/{string_value}
app.delete("/string/{string_value}", (req, res) => {

})
app.listen(3000, console.log("Listening on port 3000"))