import React, { useEffect, useState } from 'react';
import { Result, Button, Anchor } from '@arco-design/web-react';
import { useHistory } from 'react-router-dom';
import locale from './locale';
import useLocale from '@/utils/useLocale';
import styles from './style/index.module.less';
import remarkParse from 'remark-parse';
import { unified } from 'unified';
import { walk } from 'estree-walker';



function AnchorCustom(props) {
  const { content } = props;
  const AnchorLink = Anchor.Link;

  const [anchorList, setAnchorList] = useState([]);

  const contentpaerser= () => {
    if (content) {
      const ast = unified()
        .use(remarkParse)
        .parse(content);
      setAnchorList([])
      ast.children.map((item, index) => {
        if (item.type === 'heading') {
          const dept = item.depth;
          const value = item.children[0]['value']
          setAnchorList((prevList) => [...prevList, { dept: dept, value: value }]);
        }
      })

    };
  }


  useEffect(() => {
    contentpaerser()
  }, [content]);


  return (
    <Anchor affix={false} >
      {anchorList.map((item, index) => 
        <div
          key={`${index}_${item.dept}_${item.value}`}
          onClick={(event) => {
            event.preventDefault();
            const targets = document.querySelectorAll(`h${item.dept}`);
            const target = Array.from(targets).find(t => t.textContent === item.value); // 查找匹配的目标
            if (target) {
              target.scrollIntoView({ behavior: 'smooth' });
            }
          }}
        >
          <AnchorLink 
            title={item.value}
            style={{
              marginLeft: (item.dept-1) * 12 + 'px'
            }}
            href={`#${item.value}`}
          />
        </div>
      )}
    </Anchor>
  );
}

export default AnchorCustom;
