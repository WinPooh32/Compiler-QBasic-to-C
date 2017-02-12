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

function is_number(scope, token){
    var number;
    var t_token = token.type;

    if(t_token === KeyWords.Number){
        number = true;
    }else if(t_token === KeyWords.Ident) {
        var ident = find_idenifier(scope, token);

        if (ident === null) {
            throw new semantic_error("\"" + token.token + "\" isn't defined");
        }

        number = ident.data_type !== DataTypes.STRING;
    }else{
        number = false;
    }

    return number;
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

function get_const_number_type(number){
    if(number.indexOf(".") !== -1){
        return DataTypes.SINGLE;
    }else{
        return DataTypes.INTEGER;
    }
}

function get_priority(op_type){
    for(var i in Priorites){
        for (var j in Priorites[i]){
            if(op_type === Priorites[i][j]){
                return i;
            }
        }
    }

    return -1;
}

function can_cast(l_type, r_type){
    if((l_type === DataTypes.STRING && r_type !== DataTypes.STRING) ||
       (r_type === DataTypes.STRING && l_type !== DataTypes.STRING)){
        return false;
    }else{
        return true;
    }
}

function resolve_expression(scope, tokens_list, left_expected){
    var expected_type = null;
    if(left_expected !== null){
        expected_type = left_expected;
    }

    var t_token;

    var function_args = false;
    var args_count = 0;
    var arg = -1;
    var args_types_arr = [];
    var fun_expect_end = false;

    for(var i in tokens_list){
        var type = null;
        arg++;

        t_token = tokens_list[i].type;

        if(fun_expect_end){
            if(t_token >= 25){
                fun_expect_end = false;
            }else {
                throw new semantic_error("Unexpected function argument");
            }
        }

        if(t_token === KeyWords.NOT){
            type = DataTypes.INTEGER;
        }else if(t_token === KeyWords.Number){
            type = get_const_number_type(tokens_list[i].token);
        }else if(t_token === KeyWords.String){
            type = DataTypes.STRING;
        }else if(t_token === KeyWords.Ident){
            var token  = tokens_list[i];
            var ident = find_idenifier(scope, token);

            if(ident === null){
                throw new semantic_error("\""+ token.token +"\" isn't defined");
            }

            type = ident.data_type;

            if(ident.is_function && ident.args_types.length > 0){
                function_args = true;
                args_types_arr = ident.args_types;
                args_count = ident.args_types.length;
                arg = -1;
            }
        } else if(t_token === KeyWords["="]){
            type = DataTypes.INTEGER;
        }
        else{
            continue;
        }

        if(function_args){
            if(args_count == 0){
                args_count = ident.args_types.length;
                if(args_count === 0) function_args = false;
            }else if(arg == args_count - 1){
                function_args = false;
                fun_expect_end = true;
                if(!can_cast(type, args_types_arr[arg])){
                    throw new semantic_error("Incorrect function argument");
                }
                continue;
            }else{
                if(!can_cast(type, args_types_arr[arg])){
                    throw new semantic_error("Incorrect function argument");
                }
                continue;
            }
        }

        if(expected_type !== null){
            if(!can_cast(expected_type, type)){
                throw new semantic_error("Incorrect expression type");
            }
        }else{
            expected_type = type;
        }
    }

    if(function_args){
        expected("function argument");
    }

    return expected_type;
}