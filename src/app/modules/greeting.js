import Image from "next/image";

export default function Greeting(props) {
    return (
        <div className="body">
          <div className="content" style={{textAlign: 'center', lineHeight: 2}}>{props.data.greeting}</div>
          <div className="detail">
            <div className="content" style={{textAlign: 'center'}}>{props.data.parent.man.father} · {props.data.parent.man.mother}의 아들
              <span className="content" style={{fontWeight: 'bold'}}> {props.data.manName.last}{props.data.manName.first}</span>
            </div>
            <div className="content" style={{textAlign: 'center'}}>{props.data.parent.woman.father} · {props.data.parent.woman.mother}의 딸
              <span className="content" style={{fontWeight: 'bold'}}> {props.data.womanName.last}{props.data.womanName.first}</span>
            </div>
          </div>
        </div>
    );
}