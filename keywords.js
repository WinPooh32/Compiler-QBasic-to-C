"use strict";

const KeyWords = {
    //QBasic token types:
    "IntLstArg":-9,
    "FuncArg": -8,
    "String":  -7,
    "Negate":  -6,
    "Assign":  -5,
    "Label":   -4,
    "Ident":   -3,
    "Operator":-2,
    "Number":  -1,
    //Should be ignored:
    "None":     0, 
    //QBasic Keywords:
    "LET":      1,
    "IF":       2, 
    "THEN":     3, 
    "ELSE":     4, 
    "END":      5,
    "DECLARE":  6, 
    "PRINT":    7,
    "INPUT":    8,
    "FUNCTION": 9, 
    "WHILE":    10,
    "WEND":     11,
    "FOR":      12,
    "TO":       13,
    "STEP":     14,
    "NEXT":     15,
    "GOTO":     16,
    "REM":      17,
    "DIM":      18,
    "AS":       19,
    //DIM types
    "INTEGER":  20,
    "LONG":     21,
    "SINGLE":   22,
    "DOUBLE":   23,
    "STRING":   24,
    //Bool operators:
    "AND":      25,
    "OR":       26,
    "NOT":      27,
    ">":        28,
    ">=":       29,
    "<":        30,
    "<=":       31,
    "<>":       32,
    "=" :       33,
    //arithmetic operators:
    "+":        34,
    "-":        35,
    "*":        36,
    "/":        37,
    "^":        38,
    //parentheses:
    "(":        39,
    ")":        40
};
    
const Operations = {
    "LET":      0,
    "ASSIGN":   1,
    "GOTO":     2,
    "IF":       3,
    "PRINT":    4,
    "INPUT":    5,
    "DIM":      6,
    "CALL":     7,
    "WHILE":    8,
    "FOR":      9,
    "DECLFUN":  10,
    "DEFFUN":   11
};

const DataTypes = {
    "INTEGER":  0,
    "LONG":     1,
    "SINGLE":   2,
    "DOUBLE":   3,
    "STRING":   4,  
};

const Priorites = [
    [39, 40], // (, )
    [28, 29, 30, 31, 32, 33], //compare operators
    [25, 26, 27], //AND, OR, NOT
    [34, 35], // +, -
    [36, 37], // *, /
    [38] // ^
];