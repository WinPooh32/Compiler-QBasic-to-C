"use strict";

function constant(){
    console.log("DEBUG. Constant expression");
    
    var char = State.cur();
    
    if(char === '"'){
        State.mvnext(); //skip first "
        
        var string = "";
        while(State.cur() !== '"'){ // no new line parsing and other special symbols
            string += State.cur();
            State.mvnext();
            
            if(State.eof || State.cur() === "\n" ){
                expected("Closing \"");
            }
        }

        State.token = string;
        State.type = KeyWords.String;
        State.push_token();
        
        //skip last "
        State.mvnext();
        skip_white();
    }
    else if(is_digit(char)){
        var num = get_number();
        
        if(State.cur() === "."){
            State.mvnext();
            num += "." + get_number();
        }
        
        State.token = num;
        State.type = KeyWords.Number;
        State.push_token();
        
        skip_white();
    }
    else{
        //if(!State.eof) 
          expected("Expression or constant number");
    }
}

function value(){
    console.log("DEBUG. Value expression");
    
    if(is_alpha(State.cur())){ // no function call yet
        State.token = get_name();
        State.type = KeyWords.Ident;
        State.push_token();
        
        if(typeof KeyWords[State.token] !== 'undefined'){
            expected("Identifier or Number");
        }
        
        console.log(State.token);
        
        skip_white();

        if(State.cur() === "("){
            function_expr_arguments();
        }
    }
    else if(State.cur() === "("){
        State.token = "(";
        State.type = KeyWords["("];
        State.push_token();
        
        
        State.mvnext();
        skip_white();
        
        expression();
        
        match(")");
        
        //Pushing ) to tokens
        State.token = ")";
        State.type = KeyWords[")"];
        State.push_token();
        
        State.mvnext();
        skip_white();
    }
    else{
        constant();
    }
}

function power_expr(){
    console.log("DEBUG. Power expression");
    //что-то мне не нравится левая рекурсия в БНФ
    //Возьмем 1м value тогда
    value();
    skip_white();
    
    if(is_power_op(State.cur())){
        State.token = "^";
        State.type = KeyWords["^"];
        State.push_token();
        
        State.mvnext();
        skip_white();
        
        power_expr();
        skip_white();
    }
}

function negate_expr(){
    console.log("DEBUG. Negate expression");
    
    if(State.cur() === "-"){
        State.token = "-";
        State.type = KeyWords.Negate;
        State.push_token();
        
        State.mvnext();
        skip_white();
    }
    
    power_expr();
    skip_white();
}

function mult_expr(){
    console.log("DEBUG. Mult expression");
    
    negate_expr();
    skip_white();
    
    if(is_mul_op(State.cur())){
        State.token = State.cur();
        State.type = KeyWords[State.cur()];
        State.push_token();
        
        State.mvnext();
        skip_white();
        
        add_expr();
        skip_white();
    }
}

function add_expr(){
    console.log("DEBUG. Add expression");
    
    mult_expr();
    skip_white();
    
    if(is_add_op(State.cur())){
        State.token = State.cur();
        State.type = KeyWords[State.cur()];
        State.push_token();
        
        State.mvnext();
        skip_white();
        
        add_expr();
        skip_white();
    }
}

function compare_expr(from_cmp){
    console.log("DEBUG. Compare expression");

    add_expr();
    skip_white();

    if(from_cmp){
        var char = State.cur();
        if( is_rel_op(char) ){
            expected("closing ) or NewLine or :");
        }
    }
    
    if(is_rel_op(State.cur())){
        var prev_char = State.cur();
        State.mvnext();
        
        if(prev_char === "="){
            //equal op
            State.token = "=";
            State.type = KeyWords["="];
            State.push_token();
        }
        else if(prev_char === "<"){
            
            if(State.cur() === ">"){
                //not equal op
                State.token = "<>";
                State.type = KeyWords["<>"];
                State.push_token();
                
                State.mvnext();//skip 2nd op symbol
            }
            else if(State.cur() === "="){
                // <= operator
                State.token = "<=";
                State.type = KeyWords["<="];
                State.push_token();
                
                State.mvnext();//skip 2nd op symbol
            }
            else{
                // < op
                State.token = "<";
                State.type = KeyWords["<"];
                State.push_token();
            }
        }
        else if(prev_char === ">"){
            if(State.cur() === "="){
                // >= operator
                State.token = ">=";
                State.type = KeyWords[">="];
                State.push_token();
                
                State.mvnext();//skip 2nd op symbol
            }else{
                // > operator
                State.token = ">";
                State.type = KeyWords[">"];
                State.push_token();
            }
        }
        
        skip_white();

        not_expr(true);

        skip_white();

    }
}

function not_expr(from_cmp){
    console.log("DEBUG. Not expression");

    if(is_alpha(State.cur())){
        var token = get_name("NOT or Expression");
        var type = KeyWords[token.toUpperCase()];
        
        if(type === KeyWords.NOT){
            State.token = token;
            State.type = KeyWords.NOT;
            State.push_token();
            
            skip_white();
            compare_expr(from_cmp);
        }
        else{
            //EPIC HACK //FIXME
            //Move to prev state

            //No line back
            State.pos -= token.length;
            State.line_offset -= token.length;
            State.eof = false;
            
            console.log(State.eof + " MOVING BACK " + token);

            skip_white();
                compare_expr(from_cmp);
            skip_white();
        }
    }
    else{
        compare_expr(from_cmp);
    }
    
    skip_white();
}

function move_back(token){
    State.pos -= token.length;
    State.line_offset -= token.length;
    State.eof = false;
    
    if(State.line_offset < 0){
        State.line_offset = 0;
        State.line--;
    }
    
    console.log("MV back char: " + State.cur() + ' token: ' + token +' len= ' + token.length);
    
    console.log(State.eof + " MOVING BACK " + token);
}

function and_expr(){
    console.log("DEBUG. And expression");
    
    not_expr(false);
    skip_white();
    
    if(is_alpha(State.cur())){
        var token = get_name();
        var type = KeyWords[token.toUpperCase()];
        
        console.log("CATCHED");
        
        if(type === KeyWords.AND){
            State.token = token;
            State.type = type;
            State.push_token();
            
            skip_white();
                and_expr();
            skip_white();
        }
        else { // if(typeof type !== "undefined")
            //EPIC HACK //FIXME
            //Move to prev state
            move_back(token);
        }
    }
}

function expression(){
    console.log("DEBUG. Expression");
    
    and_expr();
    skip_white();
    
    if(is_alpha(State.cur())){
        var token = get_name();
        
        State.token = token;
        var type = KeyWords[token.toUpperCase()];
        
        if(type === KeyWords.OR){
            State.type = KeyWords.OR;
            State.push_token();
            
            skip_white();
                expression();
            skip_white();
        }
        else { // if(typeof type !== "undefined")
            //EPIC HACK //FIXME
            //Move to prev state
            move_back(token);
        }
    }
}

function assign(){
    console.log("DEBUG. Assign");
    
    match("=");
    State.mvnext();
    
    State.token = "=";
    State.type = KeyWords.Assign;
    State.push_token();
    
    skip_white();
    expression();
    skip_white();
}

// function next_statement(){
//     skip_white();
    
//     //
//     if(State.eof){
//         expected("end of line or :");
//     }else if (State.cur() === "\n" || State.cur() === ":"){
//         //we got \n or :
//         //skip this
//         State.mvnext();
//         skip_white();
//     }else{
//         expected("end of line or :");
//     }
// }

//list for functions and procedures

function is_semicolon(char){
    return char == ";";
}

function is_newline_colon(char){
    return char === "\n" || char === ":" || State.eof;
}

function free_list(terminate_checker, token_getter, expected_str){
    while(!State.eof && !terminate_checker(State.cur()) && !is_newline_colon(State.cur())){
        // if(is_newline_colon(State.cur())){
        //     expected(expected_str);
        // }
        
        skip_comma();
        
        token_getter();
        
        skip_comma();
        
        if( !terminate_checker(State.cur()) ){
            if(is_lexem_end(State.cur())){
                expected("Expression or constant");
            }else{
                token_getter();
            }   
        }
    }
    
    if(terminate_checker(State.cur())){
        if(!is_newline_colon(State.cur())){
            State.mvnext();
        }
    }else{
        expected(expected_str);
    }

    //console.log(">" + State.cur() + "<");

    // if(!terminate_checker("\n") && !terminate_checker(":")){
    //     State.mvnext();
    // }
}

function function_arguments(){
    match("(");
    State.mvnext();
    
    skip_white();
    
    while(State.cur() !== ")"){
        if(State.eof || is_newline_colon(State.cur())){
            expected(")");
        }

        State.token = get_typed_name();
        State.type = KeyWords.FuncArg;
        
        State.push_token();
        
        skip_comma();
    }
    
    State.mvnext();
}

function function_decl(label){
    State.token = get_name();
    State.type = KeyWords[State.token.toUpperCase()];
    
    console.log(State.token);
    
    if(State.type === KeyWords.FUNCTION){
        State.push_token();
        
        skip_white();
        
        State.token = get_typed_name();
        State.type = KeyWords.Ident;
        State.push_token();

        State.push_scope_begin();
        {
            var token_idx = State.Tokens_List.length - 1;

            skip_white();

            function_arguments();

            var end_idx = State.Tokens_List.length - 1;
            State.push_declfun(token_idx, token_idx + 1, end_idx, label);
        }
        State.push_scope_end();
    }else{
        expected("FUNCTION");
    }
}

function integer_list(){
    match("(");
    
    State.mvnext();
    skip_white();
    
    while(State.cur() !== ")"){
        if(State.eof || State.cur() === "\n" || State.cur() === ":"){
            expected(")");
        }
        
        State.token = get_number();
        State.type = KeyWords.IntLstArg;
        
        State.push_token();
        
        skip_comma();
    }
    
    State.mvnext();
}

function identifier(){
    State.token = get_name();
    State.type = KeyWords.Ident;
    State.push_token();
}

function function_expr_arguments(){
    //Fail if not typed
    check_typed_name(State.token);

    console.log("DEBUG. Function arguments");

    State.mvnext();
    skip_white();

    free_list(function (char) {
        return (char === ")");
    }, expression, "Closing )");
    skip_white();
}

function statement(){
    console.log("DEBUG. Statement");
    
    if(is_alpha(State.cur())){
        var token = get_name("Statement or Identifier");
        State.token = token;
        
        console.log("Statement token:" + token);
        
        //skip_white();
        
        var type = KeyWords[token.toUpperCase()];
        var label = get_label();
        
        if(typeof type === "undefined"){
            console.log("DEBUG. Identifier statement");

            //We got Identifier
            State.type = KeyWords.Ident;
            State.push_token();
            var token_idx = State.Tokens_List.length - 1;
            
            skip_white();
            
            if(State.cur() === "="){
                assign();
                
                //Make assign operation
                State.push_assign(token_idx, State.Tokens_List.length, label);
                
            }else if (State.cur() === "("){
                function_expr_arguments();
            }else{
                expected("Statement");
            }
        }
        else if(type === KeyWords.LET){

            State.type = type;
            State.push_token();
            
            skip_white();
            
            console.log("DEBUG. LET Statement");
            State.token = get_name();
            State.type = KeyWords.Ident;
            State.push_token();
            
            //Make let operation
            var token_idx = State.Tokens_List.length - 1;
            State.push_let(token_idx, label);
            
            skip_white();
            assign();
            
            //Make assign operation
            State.push_assign(token_idx, State.Tokens_List.length);
            
            //console.log(JSON.stringify(State.scope, null, 4));
        }
        else if(type === KeyWords.IF){
            //Begin new scope
            State.push_scope_begin();
            //Push token
            State.type = type;
            State.push_token();
            var token_idx = State.Tokens_List.length - 1;
            
            console.log("DEBUG. IF Statement");
            
            skip_white();
                expression();
            skip_white();
            
            //Make "IF" operation and move to sub scope
            State.push_if(token_idx + 1, label);// +1 skip if token
            
            State.token = get_name("THEN");
            skip_white();
            
            if(KeyWords[State.token.toUpperCase()] === KeyWords.THEN){
                State.type = KeyWords.THEN;
                State.push_token();
                skip_white();
                //skip_newline();
            }else{
                expected("THEN");
            }
            
            skip_newline();
            lines(is_statement_end, "END IF");
            
            //skip_newline();
        }
        else if(type === KeyWords.END){
            State.type = type;
            
            skip_white();
            
            if(!is_alpha(State.cur())){
                expected("IF or FUNCTION");
            }
            
            State.token = get_name();
            State.type = KeyWords[State.token.toUpperCase()];
            
            var operation = State.get_parent_scope_last_operation();
            
            switch (State.type) {
                case KeyWords.IF:
                    State.token = "END IF";//cause last taken was IF but we check only END
                break;
                    
                case KeyWords.FUNCTION:
                    State.token = "END FUNCTION";//cause last taken was IF but we check only END
                break;
                
                default:
                    expected("IF or FUNCTION");
            }
            
            State.push_token();
            State.push_scope_end();
            
            if(operation === null ||
               (operation.type !== Operations.IF && operation.type !== Operations.FUNCTION)){
                expected("Statement");
            }
            
            // if(State.type === KeyWords.IF || State.type === KeyWords.FUNCTION){
            //     //Closing scope
            //     State.token = "END";//cause last taken was IF but we check only END
            //     State.push_scope_end();
            //     //State.push_token();
            // }
            // else{
            //     expected("IF or FUNCTION");
            // }
        }
        else if(type === KeyWords.ELSE){
            State.type = type;
            State.push_token();
            skip_white();
            
            var if_operation = State.get_parent_scope_last_operation();
            
            if(if_operation !== null && 
               if_operation.type !== Operations.IF){
                expected("Statement");
            }
            
            if(State.scope.parent === null || State.scope.parent.else_branch === State.scope){
                expected("Stetement");
            }
            
            State.push_scope_end();
            
            State.push_else(if_operation);
            
            //Begin new scope
            State.push_scope_begin();
        }
        else if(type === KeyWords.WHILE){
            //Begin new scope
            State.push_scope_begin();
            
            State.type = type;
            State.push_token();
            
            var token_idx = State.Tokens_List.length - 1;
            
            
            console.log("DEBUG. WHILE Statement");
            
            skip_white();
                expression();
            skip_white();
            
            //Make WHILE operation
            State.push_while(token_idx + 1, State.Tokens_List.length, label);
             
            //scope statement
            skip_newline();
            lines(is_statement_end, "WEND");
            
        }
        else if(type === KeyWords.WEND){
            State.type = type;
            State.push_token();
            skip_white();
            
            //Closing scope
            State.push_scope_end();
        }
        else if(type === KeyWords.FOR){
            //Begin new scope
            State.push_scope_begin();

            State.type = type;
            State.push_token();

            var token_idx = State.Tokens_List.length - 1;

            skip_white();
            console.log("DEBUG. FOR Statement");
            
            State.token = get_name();
            State.type = KeyWords.Ident;
            State.push_token();
            
            skip_white();
                assign();
            skip_white();
            
            State.token = get_name();
            State.type = KeyWords[State.token];
            State.push_token();

            skip_white();
            
            if(State.type === KeyWords.TO){

                skip_white();
                    expression();
                skip_white();
                
                if(is_alpha(State.cur())){
                    State.token = get_name();
                    State.type = KeyWords[State.token];
                    
                    if(State.type === KeyWords.STEP){
                        State.push_token();
                        
                        skip_white();
                        var num = get_number();
                        State.token = num;
                        State.type = KeyWords.Number;
                        State.push_token();
                        State.push_for(token_idx, false, label);
                        skip_white();
                    }else{
                        move_back(State.token);
                    }
                }else{
                    State.push_for(token_idx, true, label);
                }
            }
            else{
                 expected("TO");
            }
            
            //scope statement
            skip_newline();
            lines(is_statement_end, "NEXT");
        }
        else if(type === KeyWords.NEXT){
            State.type = type;
            State.push_token();
            
            console.log("DEBUG. NEXT Statement");
            
            skip_white();
            
            if(!is_alpha(State.cur())){
                expected("Identifier");
            }
            
            State.token = get_name();
            State.type = KeyWords.Ident;
            State.push_token();


            //Check NEXT i
            var for_operation = State.get_parent_scope_last_operation();

            if(for_operation !== null &&
                for_operation.type !== Operations.FOR){
                expected("Statement");
            }

            var next_token = for_operation.branch.id_table[0].token.token;
            if(next_token !== State.token){
                expected("Identifier \'" + next_token + "\' ");
            }
            
            skip_white();
            
            //Closing scope
            State.token = "NEXT";//cause last taken was IF but we check only END
            State.push_scope_end();
        }
        else if(type === KeyWords.PRINT){
            State.type = type;
            State.push_token();

            var token_idx = State.Tokens_List.length - 1;

            skip_white();
            
            //free_list(is_newline_colon, expression, "New line or :");
            free_list(is_newline_colon, identifier, "New line or :");

            var last_arg_idx = State.Tokens_List.length - 1;

            State.push_print(token_idx, last_arg_idx, label);

            skip_white();
        }
        else if(type === KeyWords.INPUT){

            State.type = type;
            State.push_token();

            var token_idx = State.Tokens_List.length - 1;

            skip_white();
            
            free_list(is_newline_colon, identifier, "New line or :");

            var last_arg_idx = State.Tokens_List.length - 1;
            State.push_input(token_idx, last_arg_idx, label);

            skip_white();
        }
        else if(type === KeyWords.GOTO){
            State.type = type;
            State.push_token();

            console.log("DEBUG. GOTO Statement");

            skip_white();
            State.token = get_number();
            State.type = KeyWords.Number;
            State.push_token();

            State.push_goto(parseInt(State.token), label);
        }
        else if(type === KeyWords.DECLARE){
            State.type = type;
            State.push_token();

            skip_white();
                function_decl(label);
            skip_white();
        }
        else if(type === KeyWords.FUNCTION){
            //Begin new scope
            State.push_scope_begin();
            
            State.type = type;
            State.push_token();
            
            //scope statement
            skip_newline();
            lines(is_statement_end, "END FUNCTION");
        }
        else if(type === KeyWords.DIM){
            State.type = type;
            State.push_token();
            
            skip_white();
            
            State.token = get_name();
            State.type = KeyWords.Ident;
            State.push_token();
            
            var token_idx = State.Tokens_List.length - 1;
            var token_end_list;
            var token_type_idx;
            
            skip_white();
            integer_list();
            skip_white();
            
            token_end_list = State.Tokens_List.length - 1;
            
            State.token = get_name();
            State.type = KeyWords[State.token.toUpperCase()];
            
            if(State.type === KeyWords.AS){
                console.log("PUSH AS");
                State.push_token();
                
                skip_white();
                
                State.token = get_name();
                State.type = KeyWords[State.token.toUpperCase()];
                
                if(is_dim_type(State.type)){
                    State.push_token();
                    
                    token_type_idx = State.Tokens_List.length - 1;
                    
                    //Make DIM operation
                    State.push_dim(token_idx, token_end_list, token_type_idx, label);
                    
                    skip_white();
                }else{
                    expected("DIM data type");
                }
            }else{
                expected("AS");
            }
        }
        else if(type === KeyWords.REM){
            console.log("DEBUG. REM Statement skipping");
            skip_remark();
        }else{
            expected("Statement");
        }
    }else{ //if(!is_newline_colon(State.cur())){
        expected("Statement or Identifier");
    }
}

function labled_line(){
    console.log("DEBUG. Labeled line");
    
    State.token = get_number();
    State.type = KeyWords.Label;
    
    State.push_token();
    State.push_label(State.Tokens_List[State.Tokens_List.length - 1]);
}

function is_statement_end(token, end_token){
    return token === end_token || State.eof;
}

function global_scope_end_checker(token){
    return State.eof; 
}

function lines(terminate_cheker, end_token){
    skip_newline();
    
    //if statrts with number its labeled line
    while(!terminate_cheker(State.token, end_token)){
        
        if(is_digit(State.cur())){
            labled_line();
            
            skip_white();
            
            statement();
        }
        else 
        //if(is_alpha(State.cur()))
        {
            //statements();
            statement();
        }
        // else{
        //     skip_newline();
        // }
        //console.log("loop");
        
        
        //Hack every day
        if(!terminate_cheker(State.token, end_token)){
            skip_colon();
        }
    }
    
    
    console.log("CURRENT SCOPE CLOSING " + State.scope_cur_id);
    //Check scopes at end of file
    if( State.eof && State.scopes_openned != 0 && State.scope_cur_id === 0){
        expected("Scope closing");
    }
    else if(State.scope_cur_id > 0) {
        --State.scope_cur_id;
    }
    
    console.log("Quitting lines()");
}

function parse_tokens(text){
    //Init state string
    State.init();
    State.text = text;
    
    var token = "";
    var text_end = text.length;

    console.log("Start parsing!");
    lines(global_scope_end_checker);
    console.log("Parsing finished!");
};

function parse_with_output(text){
    
    //Disable console.log()
    //console.log = function() {};
    
    var output = "";
    var row = null, column = null;
    
    try{
        parse_tokens(text);
        //output = JSON.stringify(State.Tokens_List, null, 4);

        var cache = [];
        output = (JSON.stringify(State.global_scope, function(key, value) {
            if (typeof value === 'object' && value !== null) {
                if (cache.indexOf(value) !== -1) {
                    // Circular reference found, discard key
                    return value.token;
                }
                // Store value in our collection
                cache.push(value);
            }
            return value;
        }, ' '));
        cache = null; // Enable garbage collection

        console.error(State.global_scope);

    }catch(ex){
        if(ex.name === "error_syntax"){
            output = ex.message + "at line: " + (State.line+1) + ", pos: " + (State.line_offset+1);
            console.log(output);
        }
        else if(ex.name === "error_semantic"){
            output = "Semantic error at line: " + (State.line+1) + ", pos: " + (State.line_offset+1) + "\n";
            output += ex.message;
            console.log(output);
        }
        else{
            console.log(ex);
            console.log(State.pos);
            console.log(ex.stack);
            
            output = " " + ex + '\n' + State.pos + "\n" + ex.stack;
        }
        
        row = State.line + 1;
        column = State.offset;
    }
    
    State.init();
    return {text: output, error: {row: row, column: column}};
}