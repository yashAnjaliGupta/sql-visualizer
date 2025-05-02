import React from 'react';
import {codeToAst,sqlAstToGraph,getAllTableNodesAsTableNodes} from '../parser/graphGenerator';

interface ASTDisplayBoxProps {
    input: string;
}

const ASTDisplayBox: React.FC<ASTDisplayBoxProps> = ({ input }) => {
    const ast = codeToAst(input);
    // console.log(ast);
    // const g=sqlAstToGraph(ast);
    // // console.log(JSON.stringify(g, null, 2));
    // const temp=getAllTableNodesAsTableNodes(g);
    // console.log(temp);
    const astString = JSON.stringify(ast, null, 2);
    return (
        <div style={{ width: '25vw', height: '70vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', border: '1px solid black' }}>
            <pre style={{ width: '100%', whiteSpace: 'pre', overflow: 'auto' }}>{astString}</pre>
        </div>
    );
};

export default ASTDisplayBox;
