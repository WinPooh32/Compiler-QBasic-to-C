"use strict";

//==============================================================================
//Operations generators

function push_identifier(scope, id_obj){
    scope.id_table.push(id_obj);
    return id_obj;
}

function find_idenifier(scope, token_obj){
    if(scope === null){
        return null;
    }
    
    for(var i in scope.id_table){
        if(scope.id_table[i].token.token === token_obj.token){
            return scope.id_table[i];
        }
    }
    
    return find_idenifier(scope.parent, token_obj);
}

function mk_abstract_syntax_tree(raw_tokens){
    //do nothing for now
    return raw_tokens;
}

function mk_scope(parent_scope){
    return {
        parent: parent_scope,
        id_table: [],
        operations: []
    };
}

function mk_operation_let(scope, id_token_idx, type, label_val){
    var token = State.Tokens_List[id_token_idx];
    
    if(find_idenifier(scope, token) !== null){
        throw new semantic_error("\""+ token +"\" already defined");
    }
    
    var id = push_identifier(scope, {
        token: State.Tokens_List[id_token_idx],
        data_type: type, 
        is_function: false
    });
    
    return {
        type: Operations.LET,
        label: label_val,
        identifier: id
    };
}

function mk_operation_assign(scope, id_token_idx, type, expression_raw_tokens, label_val){
    var token = State.Tokens_List[id_token_idx];
    var id = find_idenifier(scope, token);
    
    if(id === null){
        throw new semantic_error("Identifier \"" + token.token + "\" is not defined there");
    }
    
    return {
        type: Operations.ASSIGN,
        label: label_val,
        identifier: id,
        expression: mk_abstract_syntax_tree(expression_raw_tokens)
    };
}

function mk_operation_goto(go_to, label_val){
    return {
        type: Operations.GOTO,
        label: label_val,
        to: go_to
    };
}

function mk_operation_if(scope, expression_raw_tokens, label_val){
    return{
        type: Operations.IF,
        label: label_val,
        expression: mk_abstract_syntax_tree(expression_raw_tokens),
        then_branch: mk_scope(scope),
        else_branch: undefined
    };
}

function mk_operation_print(scope, id_token_idx, label_val){
    return {
        type: Operations.PRINT,
        label: label_val,
        list: []
    };
}

function mk_operation_dim(scope, id_token_idx, dims_array, type, label_val){
    var token = State.Tokens_List[id_token_idx];

    if(find_idenifier(scope, token) !== null){
        throw new semantic_error("Already defined");
    }
    
    var id = push_identifier(scope, {
        token: State.Tokens_List[id_token_idx],
        data_type: type, 
        is_function: false
    });
    
    return {
        type: Operations.DIM,
        label: label_val,
        id: id,
        sizes: dims_array
    };
}

function mk_operation_while(scope, expression_raw_tokens, label_val){
    return {
        type: Operations.WHILE,
        label: label_val,
        expression: mk_abstract_syntax_tree(expression_raw_tokens),
        branch: mk_scope(scope)
    };
}

function mk_operation_for(scope, counter, start, step, until, label_val){
    var sub_scope = mk_scope(scope);

    //Register counter id
    push_identifier(sub_scope, {
        token: counter,
        data_type: DataTypes.INTEGER,
        is_function: false
    });

    return {
        type: Operations.FOR,
        label: label_val,
        counter: counter,
        start: start,
        step: step,
        until: until,
        branch: sub_scope
    };
}

// DECLFUN:
// {
//     type: 10,
//     label: undefined,
//     fun_id: name_ptr,
//     args: [name_ptr, ...]
// }

function mk_operation_declfun(scope, id_token_idx, type, list_args_indeces, label_val){
    var token = State.Tokens_List[id_token_idx];
    
    if(find_idenifier(scope, token) !== null){
        throw new semantic_error("Already defined");
    }
    
    var branch = mk_scope(scope);
    var args_list = [];
    var types_list = [];
    for(var i in list_args_indeces){
        var ptr_token = State.Tokens_List[list_args_indeces[i]];
        var arg_type = get_token_type(ptr_token.token);
        
        var arg = push_identifier(branch, {
            token: ptr_token,
            data_type: arg_type, 
            is_function: false
        });
        
        args_list.push(arg);
        types_list.push(arg_type);
    }

    var id = push_identifier(scope, {
        token: State.Tokens_List[id_token_idx],
        data_type: type,
        is_function: true,
        args_types: types_list,
        args_names: args_list,
        definition: null
    });
    
    return {
        type: Operations.DECLFUN,
        label: label_val,
        fun_id: id,
        //branch: branch,
        //args: args_list
    }
}


//==============================================================================