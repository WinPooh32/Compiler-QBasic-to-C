"use strict";

function syntax_error(message) {
   this.message = message;
   this.name = "error_syntax";
}

function semantic_error(message){
    this.message = message;
    this.name = "error_semantic";
}

function abort(message){
    throw new syntax_error(message);
}

function expected(message, type){
    if(type){
        type = "as " + type;
    }else{
        type = "as unknown statement";
    }
    
    var error_at = State.text.substring(State.pos - State.token.length, State.pos + State.token.length).split("\n")[0];
    var word_at_cursor = get_word_at_cursor();
    
    switch (word_at_cursor) {
        case "":
            word_at_cursor = "<EndOfFile>";
            break;
            
        case "\n":
            word_at_cursor = "<NewLine>";
            break;
        default:
            // code
    }
    
    var error = "Syntax Error at: \"" + error_at + "\",\n";
    var before = "before \"" + word_at_cursor + "\""; //type;
    abort(error + "expected: \"" + message + "\" " + before +"\n");
}

function match(char){
    if(State.cur() != char){
        expected(char);
    }
}