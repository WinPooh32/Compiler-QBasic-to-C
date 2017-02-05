"use strict";

function lookup_token(key){
    for(var i in State.Tokens_List){
        if(State.Tokens_List[i].token === key){
            return i;
        }
    }
    return -1;
}

function find_label(label){
    for(var i in  State.Labels_List){
        if(State.Labels_List[i].label === label){
            return i;
        }
    }
    return -1;
}

function in_range(val, range){
    return val >= range[0] && val <= range[1];
}

function is_alpha(char){
    return !State.eof && in_range(char.toUpperCase(), ['A', 'Z']) || char === "_";
}

function is_digit(char) {
    return !State.eof && in_range(char, ['0','9'])
}

//Recognize an Alphanumeric Character
function is_AlNum(char){
    return is_alpha(char) || is_digit(char);
}

function is_rel_op(char){
    switch(char){
        case "=":
        case "<":
        case ">":
        return true;
        
        default:
            return false;
    }
}

function is_add_op(char){
    switch(char){
        case "+":
        case "-":
            return true;
        
        default:
            return false;
    }
}

function is_mul_op(char){
    switch(char){
        case "*":
        case "/":
            return true;
        
        default:
            return false;
    }
}

function is_dim_type(integer){
    switch(integer){
        case KeyWords.INTEGER:
        case KeyWords.LONG:
        case KeyWords.SINGLE:
        case KeyWords.DOUBLE:
        case KeyWords.STRING:
            return true;
        
        default:
            return false;
    }
}

function is_power_op(char){
    return char === "^";
}

function is_white(char){
    return char === " ";
}

// postfix types
function is_type(char){
    switch(char){
        case "%":
        case "&":
        case "!":
        case "#":
        case "$":
            return true;
        
        default: 
            return false;
    }
}

function dim_type(string){
    var type = DataTypes[string.toUpperCase()];
    
    if(typeof type === 'undefined'){
        return null;    
    }
    
    switch(type){
        case DataTypes.INTEGER:
        case DataTypes.LONG:
        case DataTypes.SINGLE:
        case DataTypes.DOUBLE:
        case DataTypes.STRING:
            return type;
        
        default:
            return null;
    }
}

/*
$ String
% Integer
& Long
! Single
# Double
*/

function get_token_type(token){
    var char = token.charAt(token.length - 1);
    
    switch(char){
        case "%":
            return DataTypes.INTEGER;
        case "&":
            return DataTypes.LONG;
        case "!":
            return DataTypes.SINGLE;
        case "#":
            return DataTypes.DOUBLE;
        case "$":
            return DataTypes.STRING;
        
        default: 
            return null;
    }
}