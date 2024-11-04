import React from 'react';
import { Result, Button, Anchor } from '@arco-design/web-react';
import { useHistory } from 'react-router-dom';
import locale from './locale';
import useLocale from '@/utils/useLocale';
import styles from './style/index.module.less';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { a11yDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import { IconCopy } from '@arco-design/web-react/icon';
import clipboard from '@/utils/clipboard';


function MarkDown(props) {
  const { content } = props;
  if (!content) return <></>;

  
  return (
    <div>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          iframe: props => <iframe {...props} />,
          video: props => <video {...props} />,
          source: props => <source {...props} />,
          img: ({ src, alt }) => (
            /\.mp4|\.avi|\.mov|\.mkv|\.webm$/i.test(src) ? (
              <video controls width={500} height={300}>
                <source src={src} type="video/mp4" />
              </video>
            ) : (
              <img src={src} alt={alt} width={500} height={'auto'} />
            )
          ),
          code: props => {
            const { children, className, node, ...rest } = props;
            const match = /language-(\w+)/.exec(className || '');
            return (
              <>
                <Button
                  style={{ position: 'relative', top: 36, left: 'calc(100% - 36px)', zIndex: 999 }}
                  size={'mini'}
                  icon={<IconCopy />}
                  onClick={() => clipboard(children)}
                />
                {match ? (
                  <>
                    <SyntaxHighlighter
                      style={a11yDark}
                      language={match[1]}
                      customStyle={{
                        overflowX: 'auto',
                        fontSize: '12px',
                      }}
                    >
                      {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                  </>
                ) : (
                  <code
                    {...rest}
                    className={
                      className +
                      ' text-xs leading-4 px-1 rounded-sm bg-[#878378] bg-opacity-15 dark:bg-teal  text-[#EB5757] dark:text-cyan-300 font-code'
                    }
                  >
                    {children}
                  </code>
                )}
              </>
            );
          },
          table: ({ children }) => (
            <table className={styles.table}>
              {children}
            </table>
          ),
          tr: ({ children }) => (
            <tr className={styles.tr}>
              {children}
            </tr>
          ),
          th: ({ children }) => (
            <th className={styles.th}>
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className={styles.td}>
              {children}
            </td>
          ),
        }}
        children={content}
      />
    </div>
  );
}

export default MarkDown;
