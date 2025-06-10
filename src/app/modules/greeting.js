export default function Greeting({ greeting, relation }) {
    return (
        <div className="body">
          <div className="content" style={{textAlign: 'center', lineHeight: 2, whiteSpace : "pre-wrap"}}>{greeting}</div>
          <div className="detail" style={{alignItems: 'center'}}>
            <div className="content" style={{display: 'grid', gridTemplateColumns: '138px 28px auto', columnGap: '8px'}}>
              <div style={{display: 'grid', gridTemplateColumns: '56px 4px auto', columnGap: '4px'}}>
                <div style={{textAlign: 'right'}}>{relation[0].parent[0]}</div>
                <div>·</div>
                <div>{relation[0].parent[1]}의</div>
              </div>
              <div style={{textAlign: 'center'}}>{relation[0].title}</div>
              <div style={{fontWeight: 'bold', textAlign: 'center'}}>{relation[0].name}</div>
            </div>
            <div className="content" style={{display: 'grid', gridTemplateColumns: '138px 28px auto', columnGap: '8px'}}>
              <div style={{display: 'grid', gridTemplateColumns: '56px 4px auto', columnGap: '4px'}}>
                <div style={{textAlign: 'right'}}>{relation[1].parent[0]}</div>
                <div>·</div>
                <div>{relation[1].parent[1]}의</div>
              </div>
              <div style={{textAlign: 'center'}}>{relation[1].title}</div>
              <div style={{fontWeight: 'bold', textAlign: 'center'}}>{relation[1].name}</div>
            </div>
          </div>
        </div>
    );
}