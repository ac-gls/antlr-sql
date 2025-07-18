grammar SqlCase;

// Parser rules
caseExpression
    : CASE whenClause+ elseClause? END
    ;

whenClause
    : WHEN condition THEN expression
    ;

elseClause
    : ELSE expression
    ;

condition
    : columnRef IN LPAREN valueList RPAREN
    | columnRef EQUALS value
    | columnRef NOT IN LPAREN valueList RPAREN
    | condition AND condition
    | condition OR condition
    | LPAREN condition RPAREN
    ;

columnRef
    : LBRACKET IDENTIFIER RBRACKET
    | IDENTIFIER
    ;

valueList
    : value (COMMA value)*
    ;

value
    : NUMBER
    | STRING
    | NULL
    ;

expression
    : value
    | columnRef
    ;

// Lexer rules
CASE        : [Cc][Aa][Ss][Ee] ;
WHEN        : [Ww][Hh][Ee][Nn] ;
THEN        : [Tt][Hh][Ee][Nn] ;
ELSE        : [Ee][Ll][Ss][Ee] ;
END         : [Ee][Nn][Dd] ;
IN          : [Ii][Nn] ;
NOT         : [Nn][Oo][Tt] ;
AND         : [Aa][Nn][Dd] ;
OR          : [Oo][Rr] ;
NULL        : [Nn][Uu][Ll][Ll] ;
EQUALS      : '=' ;
LPAREN      : '(' ;
RPAREN      : ')' ;
LBRACKET    : '[' ;
RBRACKET    : ']' ;
COMMA       : ',' ;

NUMBER      : [0-9]+ ('.' [0-9]+)? ;
STRING      : '\'' (~'\'' | '\'\'')* '\'' ;
IDENTIFIER  : [a-zA-Z_][a-zA-Z0-9_]* ;

WS          : [ \t\r\n]+ -> skip ;
