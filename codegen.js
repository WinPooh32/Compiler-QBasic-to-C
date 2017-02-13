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

var Used_Labels;
var FunDeclarations;

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



function convert_typed_var(qbs_typed_id_name){
    var type = qbs_typed_id_name.charAt(qbs_typed_id_name.length - 1);
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

        default:
            return qbs_typed_id_name;
    }

    return prefix + qbs_typed_id_name.slice(0, -1);
}

function generate_operator(op_id){
    switch(op_id){
        case KeyWords["^"]:
            return " (T_T) ";

        case KeyWords["AND"]:
            return "&&";

        case KeyWords["OR"]:
            return "||";

        case KeyWords["NOT"]:
            return "!";

        default:
            return find_keyword(op_id);
    }
}

function generate_expression(tokens){
    var str_expr = "";

    for(var i in tokens){
        if(tokens[i].type >= KeyWords["AND"] && tokens[i].type <= KeyWords["^"]){
            str_expr += generate_operator(tokens[i].type);
        }
        else if(tokens[i].type === KeyWords.String){
            str_expr += "\""+tokens[i].token+"\"";
        }
        else{
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

function generate_input(ids_list){
    var str = "scanf(\"";
    for(var i in ids_list){
        str +=  TYPE_TO_PRINTF_FORMAT[ids_list[i].data_type];
    }
    str += "\"";

    for(var i in ids_list){
        if(ids_list[i].data_type !== DataTypes.STRING){
            str += ", &" + ids_list[i].token.token;
        }else{
            str += ", " + ids_list[i].token.token;
        }
    }
    str += ");";

    return str;
}

function generate_print(ids_list){
    var str = "printf(\"";
    for(var i in ids_list){
        str +=  TYPE_TO_PRINTF_FORMAT[ids_list[i].data_type] + " ";
    }
    str += "\\n\"";

    for(var i in ids_list){
        str += ", " + ids_list[i].token.token;
    }
    str += ");";

    return str;
}

function generate_power_operator(base, exponent){
    return "pow("+base+", "+exponent+")";
}

function generate_help_includes(){
    return  "#include <stdio.h>\n" +
            "#include <math.h>";
}

function generate_fun_args_list(args_types, args_names){
    var str_list = "(";

    for(var i in args_types){
        str_list +=  resolve_type(args_types[i])+" "+convert_typed_var(args_names[i].token.token);
        if(i < args_types.length - 1){
            str_list += ", ";
        }
    }
    str_list += ")"

    return str_list;
}

function generate_var_declaration(var_name, var_type_id){
    return resolve_type(var_type_id) + " " + var_name + ";";
}

function generate_array_declaration(array_name, array_type_id, sizes_list) {
    var sizes = "";
    for(var i in sizes_list){
        sizes += "["+sizes_list[i]+"]";
    }

    return resolve_type(array_type_id) + " " + array_name + sizes + ";";
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

function build_fun_declaration(operation) {
    var return_type = resolve_type(operation.fun_id.data_type);
    var id_name = convert_typed_var(operation.fun_id.token.token);

    return return_type+" "+id_name+" "+generate_fun_args_list(operation.fun_id.args_types, operation.fun_id.args_names)+";";
}

function build_input(operation){
    return generate_input(operation.list);
}

function build_print(operation){
    return generate_print(operation.list);
}

function build_dim(operation){
    return generate_array_declaration(operation.identifier.token.token,
                                      operation.identifier.data_type,
                                      operation.sizes);
}

function build_if(operation){
    var expression  = generate_expression(operation.expression);
    var then_branch = build_from_subtree(operation.then_branch);
    var else_branch = "";

    if(operation.else_branch){
        else_branch = "else{\n" + build_from_subtree(operation.else_branch) + "}";
    }

    return "if("+expression+"){\n"+ then_branch + "}" + else_branch;
}

function build_while(operation){
    var expression = generate_expression(operation.expression);
    var branch = build_from_subtree(operation.branch);

    return "while("+expression+"){\n"+branch+"}";
}

function build_for(operation){
    var step_token = operation.step.token;
    var counter_token = operation.counter.token;
    var start_token = operation.start.token;
    var until_token = operation.until.token;

    var step = "";
    var cmp_op = "<";

    if(parseInt(step_token) < 0 ){
        cmp_op = " >= ";
        step = " = " + counter_token + " - " + step_token;
    }else{
        step = " = " + counter_token + " + " + step_token;
    }

    return "for(int " + operation.counter.token + " = " + start_token + "; " +
            counter_token + cmp_op + until_token + "; " +
            counter_token + step + "){\n" + build_from_subtree(operation.branch) + "}";
}

function build_goto(operation){
    return "goto " + find_label_by_num(operation.to) + ";";
}

function build_assign(operation){
    var id_name = convert_typed_var(operation.identifier.token.token);
    return generate_var_assign(id_name, generate_expression(operation.expression));
}

function build_let(operation) {
    var id_name = convert_typed_var(operation.identifier.token.token);
    return generate_var_declaration(id_name, operation.identifier.data_type);
}

function build_operation(qbs_operation, result_accum){

    result_accum += build_babel(qbs_operation);

    switch(qbs_operation.type){
        case Operations.LET:
            result_accum += build_let(qbs_operation);
            break;

        case Operations.ASSIGN:
            result_accum += build_assign(qbs_operation);
            break;

        case Operations.GOTO:
            result_accum += build_goto(qbs_operation);
            break;

        case Operations.PRINT:
            result_accum += build_print(qbs_operation);
            break;

        case Operations.INPUT:
            result_accum += build_input(qbs_operation);
            break;

        case Operations.DIM:
            result_accum += build_dim(qbs_operation);
            break;

        case Operations.CALL:
            break;

        case Operations.IF:
            result_accum += build_if(qbs_operation);
            break;

        case Operations.WHILE:
            result_accum += build_while(qbs_operation);
            break;

        case Operations.FOR:
            result_accum += build_for(qbs_operation);
            break;

        case Operations.DECLFUN:
            FunDeclarations += build_fun_declaration(qbs_operation) + "\n";
            break;

        case Operations.DEFFUN:
            break;
    }

    return result_accum + generate_new_line();
}

function build_from_subtree(qbs_scope, result_accum){
    if(!result_accum){
        result_accum = "";
    }

    for(var i in qbs_scope.operations){
        result_accum = build_operation(qbs_scope.operations[i], result_accum);
    }

    return result_accum;
}

function build_c_code(qbs_tree){
    Used_Labels = {};
    FunDeclarations = "";

    var includes = generate_help_includes();
    var code = build_from_subtree(qbs_tree);

    return includes + "\n\n" +
           FunDeclarations + "\n\n" +
           "void main(){" + "\n" +
           code +
           "}";
}