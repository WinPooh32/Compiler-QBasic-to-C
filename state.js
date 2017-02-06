"use strict";

//Current pos and program text
var State =
{
    init: function(){
        this.text = "";
        this.pos = 0;
        this.line = 0;
        this.line_offset = 0;
        
        this.start_line = 0;
        this.start_offset = 0;
        
        //Scopes----------------------
        this.scope_cur_id = 0;
        this.scope_last_id = 0; // id of last scope
        this.scopes_stack = [0]; // stores ids of scopes,
        this.scopes_openned = 0;
        
        this.scopes_total_openned = 0;
        this.scopes_total_closed = 0;

        //this.id_table = {};
        
        this.global_scope = mk_scope(null);
        this.scope = this.global_scope;
        this.expr_started = 0; //index of started expression or free list in tokens list
        //----------------------------
        
        this.token = "";
        this.type = KeyWords.None;
        this.Tokens_List = [];
        this.Labels_List = [];
        
        this.eof = false;
    },
    
    cur: function(){
        if(this.eof) return "";
        return this.text[this.pos];
    },
    
    mvnext: function(){
        if(this.eof) return;
        
        this.pos++;
        this.line_offset++;
        
        if(this.cur() === "\n"){
            this.line++;
            this.line_offset = 0;
            //this.pos++; we have skip_white
        }
        
        if(this.pos >= this.text.length){
            console.log("DEBUG. End of file is reached!");
            this.eof = true;
        }
    },
    
    get_parent_scope_last_operation: function(){
        if(this.scope.parent !== null && this.scope.parent.operations.length > 0){
            return this.scope.parent.operations[this.scope.parent.operations.length - 1];
        }else{
            return null;
        }
    },
    
    push_token: function(){
        
        // if(this.Tokens_List.length === 0){
        //     this.Tokens_List.push([]);
        // }
        
        //Push to current scope
        this.Tokens_List.push({
                            token: this.token, 
                            type: this.type,
                            line: this.start_line + 1,
                            offset: this.start_offset,
                            scope: this.scope_cur_id
        });
    },

    push_label: function (token_label) {
        var label = parseInt(token_label.token);

        var found = find_label(label);
        if(found !== -1){
            var idx = lookup_token(token_label.token);
            throw new semantic_error('Label "' + label + '" already has been defined at line ' +  this.Tokens_List[idx].line);
        }

        this.Labels_List.push({label: label, token: token_label});
    },

    push_let: function(idennifier_idx, label){
        var token_data_type = get_token_type(this.Tokens_List[idennifier_idx].token);
        this.scope.operations.push(mk_operation_let(this.scope, idennifier_idx, token_data_type, label));
    },
    
    push_assign: function(idennifier_idx, expr_last_idx, label){
        var token_data_type = get_token_type(this.Tokens_List[idennifier_idx].token);
        var ExprTokens = this.Tokens_List.slice(idennifier_idx + 2, expr_last_idx); // +2 skips '=' token and id
        var type = resolve_expression(this.scope, ExprTokens, token_data_type);

        this.scope.operations.push(mk_operation_assign(this.scope, idennifier_idx, type, ExprTokens, label));
    },

    push_goto: function (go_to, label) {

        var found = find_label(go_to);
        if(found === -1){
            throw new semantic_error('Label "' + go_to + '" isn`t defined yet');
        }

        this.scope.operations.push(mk_operation_goto(go_to, label));
    },
    
    push_if: function(statement_idx, label){
        var operation = mk_operation_if(this.scope, this.Tokens_List.slice(statement_idx), label);
        this.scope.operations.push(operation);
        
        this.scope = operation.then_branch;
    },
    
    push_else: function(if_operation){
        if_operation.else_branch = mk_scope(this.scope);
        
        //set current scope to else branch
        this.scope = if_operation.else_branch;
    },
    
    push_dim: function(token_idx, token_end_list_idx, token_type_idx, label){
        var type_str = this.Tokens_List[token_type_idx].token;
        
        //convert tokens to integers
        var sizes_tokens_lst = this.Tokens_List.slice(token_idx + 1, token_end_list_idx + 1);
        var sizes_lst = [];
        for(var i in sizes_tokens_lst){
            sizes_lst.push(parseInt(sizes_tokens_lst[i].token));
        }

        var operation = mk_operation_dim(this.scope, token_idx, sizes_lst, dim_type(type_str), label);
        this.scope.operations.push(operation);
    },
    
    push_while: function(expr_begin_idx, expt_end_idx, label){
        var ExprTokens = this.Tokens_List.slice(expr_begin_idx, expt_end_idx + 1);
        var operation = mk_operation_while(this.scope, ExprTokens, label);
        
        this.scope.operations.push(operation);
        this.scope = operation.branch;
    },

    push_for: function (token_idx, default_step, label) {
        var counter = this.Tokens_List[token_idx + 1];
        var start = this.Tokens_List[token_idx + 3];
        var until = this.Tokens_List[token_idx + 5];

        var step;
        if(default_step){
            step = {token: "1"};
        }else{
            step = this.Tokens_List[token_idx + 7];
        }

        var operation = mk_operation_for(this.scope, counter, start, step, until, label);

        this.scope.operations.push(operation);
        this.scope = operation.branch;
    },
    
    push_declfun: function(token_idx, list_begin_idx, list_end_idx, label){
        var list_indeces = [];
        for(var i = list_begin_idx; i <= list_end_idx; i++){
            list_indeces.push(i);
        }

        var type = get_token_type(this.Tokens_List[token_idx].token);

        this.scope.operations.push(mk_operation_declfun(this.scope, token_idx, type, list_indeces, label));
    },
    
    push_scope_begin: function(){
        ++this.scopes_openned;
        ++this.scopes_total_openned;
        
        this.scope_cur_id = ++this.scope_last_id;
        this.scopes_stack.push(this.scope_cur_id);
    },
    
    push_scope_end: function(){
        --this.scopes_openned;
        ++this.scopes_total_closed;
        
        this.scopes_stack.pop();
        
        if(this.scopes_stack.length > 0){
            this.scope_cur_id = this.scopes_stack[this.scopes_stack.length - 1];

            if(this.scope !== this.global_scope){
                this.scope = this.scope.parent;
            }
        }
        
        console.log(this.scope_cur_id);
    }
};

function skip_white(){
    while(!State.eof && is_white(State.cur())){
        State.mvnext();
    }
}

function skip_comma(){
    skip_white();
    if(!State.eof && State.cur() === ","){
        State.mvnext();
        skip_white();
    }
}

function skip_newline(){
    skip_white();
    while(State.cur() === "\n"){
        State.mvnext();
        skip_white();
    }
    
    console.log("DEBUG. SKIP new line, is eof:" + State.eof);
}

function skip_colon(){
    skip_white();
    
    var skipped = 0;
    
    while(State.cur() === "\n" || State.cur() === ":"){
        ++skipped;
        State.mvnext();
        skip_white();
    }
    
    if(skipped === 0){
        console.log("SKIP CHAR " + State.cur() );
         if(!State.eof) 
             expected("New line or :");
    }
}

function skip_remark(){
    while(!State.eof && State.cur() !== "\n"){
        State.mvnext();
    }
    skip_white();
}

function get_word_at_cursor(){
    var l_pos = State.pos;
    var r_pos = State.pos;
    
    //Skip untill word to left white
    var char = State.text.charAt(l_pos);
    while(!is_lexem_end(char) && l_pos - 1 >= 0){
        char = State.text.charAt(--l_pos);
    }
    
    //Skip to right side
    char = State.text.charAt(r_pos);
    while(!is_lexem_end(char) && r_pos + 1 < State.text.length){
        char = State.text.charAt(++r_pos);
    }
    
    return State.text.substring(l_pos + 1, r_pos);
}

//Get an Identifier
function get_name_without_type(expectation){
    if(!is_alpha(State.cur())){
        if(expectation){
            expected(expectation);
        }
        else {
            expected("Statement");
        }
    }
    
    var name = "";
    
    State.start_line = State.line;
    State.start_offset = State.line_offset;
    
    while(!State.eof && is_AlNum(State.cur())){
        name += State.cur();
        State.mvnext();
    }
    
    return name;
}

function check_typed_name(token){
    if(!is_type(token.charAt(token.length - 1))){
        expected("Type definition");
    }
}

function get_typed_name(expectation){
    var name = get_name_without_type(expectation);
    
    if(is_type(State.cur())){
        name += State.cur();
        State.mvnext();
    }else{
        expected("Type definition");
    }
    
    return name;
}

function get_name(expectation){
    var name = get_name_without_type(expectation);
    
    if(is_type(State.cur())){
        name += State.cur();
        State.mvnext();
    }
    
    //skip_white();
    return name.toUpperCase();
}

function is_lexem_end(char){
    if(State.eof || is_add_op(char) || is_mul_op(char) || is_power_op(char)){
        return true;
    }
    
    switch(char){
        case " ":
        case "\n":
        case ":":
        case "(":
        case ")":
        case ".":
        case ",":
            return true;
    }
    
    return false;
}

//Get a number
function get_number(){
    if(!is_digit(State.cur())){
        expected("Const number");
    }
    
    var number = "";
    
    State.start_line = State.line;
    State.start_offset = State.line_offset;
    
    while(!State.eof && !is_lexem_end(State.cur())){
        if(!is_digit(State.cur())){
            expected("Const number");
        }
        
        number += State.cur();
        State.mvnext();
    }
    
    //skip_white();
    return number;
}

function get_label(){
    var len = State.Tokens_List.length;
    var tmp = State.Tokens_List[ len - 1];

    if(tmp && tmp.type === KeyWords.Label) {
        return parseInt(tmp.token);
    }
    return undefined;
}
