const C_TYPES = [
    "int",      //0
    "int",      //1
    "float",    //2
    "double",   //3
    "char*"     //4
];

const TYPE_TO_PRINTF_FORMAT = [
    "%d",
    "%d",
    "%f",
    "%f",
    "%s"
];

var Used_Labels = {};

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

function find_label_by_num(go_to){
    var keys = Object.keys(Used_Labels);

    for(var i in keys){
        if(Used_Labels[keys[i]] === go_to){
            return keys[i];
        }
    }
}

function resolve_type(type_id){
    return C_TYPES[type_id];
}

function find_keyword(id){
    var keys = Object.keys(KeyWords);

    for(var i in keys){
        if(KeyWords[keys[i]] === id){
            return keys[i];
        }
    }
}



function convert_typed_var(qbs_typed_id_name, type){
    if(typeof(type) === "undefined"){
        return qbs_typed_id_name;
    }

    var prefix;

    switch(type){
        case "$":
            prefix = "__str__";
            break;

        case "%":
            prefix = "__int__";
            break;

        case "&":
            prefix = "__int__";
            break;

        case "!":
            prefix = "__float__";
            break;

        case "#":
            prefix = "__double__";
    }

    return prefix + qbs_typed_id_name;
}

function generate_operator(op_id, left_str, right_str){
    switch(op_id){
        case KeyWords["^"]:
            return " (T_T) ";

        default:
            return left_str+" "+find_keyword(op_id)+" "+right_str;
    }
}

function generate_expression(tokens){
    var str_expr = "";

    for(var i in tokens){
        if(tokens[i].type <= KeyWords["AND"] && tokens[i].type >= KeyWords["^"]){
            str_expr = generate_operator(tokens[i].type, str_expr, tokens[i].token);
        }else{
            str_expr += tokens[i].token;
        }
    }

    return str_expr;
}

function generate_unique_label(go_to){
    var result;

    do{
        result = "";
        for(var i = 0; i < 5; ++i){
            if(getRandomInt(0, 2) == 0){
                result += String.fromCharCode(getRandomInt(65, 91));
            }else{
                result += String.fromCharCode(getRandomInt(97, 123));
            }
        }
    }while(Used_Labels[result])

    Used_Labels[result] = go_to;

    return result;
}

function generate_new_line(){
    return "\n";
}

function generate_print(ids_list){
    var str = "\"";
    for(var i in ids_list){
        str +=  TYPE_TO_PRINTF_FORMAT[ids_list[i].data_type] + " ";
    }
    str += "\\n\"";

    for(var i in ids_list){
        str += ", " + ids_list[i].token.token;
    }
    str += ");";
}

function generate_power_operator(base, exponent){
    return "pow("+base+", "+exponent+")";
}

function generate_help_includes(){
    return  "#include <stdio.h>\n" +
            "#include <math.h>";
}


function generate_var_declaration(var_name, var_type_id){
    return resolve_type(var_type_id) + " " + var_name + ";";
}

function generate_array_declaration(array_name, array_type_id, sizes_list) {
    var sizes = "";
    for(var i in sizes_list){
        sizes += "["+sizes_list[i]+"]";
    }

    return resolve_type(array_type_id) + array_name + sizes + ";";
}

function generate_var_assign(var_name, str_expr){
    return var_name + " = " + str_expr + ";";
}

function build_babel(operation){
    if(operation.label){
        return generate_unique_label(operation.label) + ": ";
    }
    return "";
}

function build_goto(operation){
    return "goto " + find_label_by_num(operation.to) + ";";
}

function build_assign(operation){
    return generate_var_assign(operation.identifier.token.token, generate_expression(operation.expression));
}

function build_let(operation) {
    return generate_var_declaration(operation.identifier.token.token, operation.identifier.data_type);
}

function build_operation(qbs_operation, result_accum){
    switch(qbs_operation.type){
        case Operations.LET:
            result_accum += build_babel(qbs_operation) + build_let(qbs_operation);
            break;

        case Operations.ASSIGN:
            result_accum += build_babel(qbs_operation) + build_assign(qbs_operation);
            break;

        case Operations.GOTO:
            result_accum += build_babel(qbs_operation) + build_goto(qbs_operation);
            break;

        case Operations.PRINT:
            break;

        case Operations.INPUT:
            break;

        case Operations.DIM:
            break;

        case Operations.CALL:
            break;

        case Operations.WHILE:
            break;

        case Operations.FOR:
            break;

        case Operations.DECLFUN:
            break;

        case Operations.DEFFUN:
            break;
    }

    return result_accum;
}

function build_from_subtree(qbs_scope, result_accum){
    if(typeof(result_accum) === 'undefined'){
        result_accum = "";
    }

    for(var i in qbs_scope.operations){
        result_accum = build_operation(qbs_scope.operations[i], result_accum) + generate_new_line();
    }

    return result_accum;
}

function build_c_code(qbs_tree){
    Used_Labels = {};
    return build_from_subtree(qbs_tree);
}