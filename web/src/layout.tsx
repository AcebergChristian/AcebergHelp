import React, { useContext, useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { Menu, Button, Layout, Input, Select, Message, Drawer, Spin, Tooltip, Divider, Image, Dropdown, Form, Modal, List } from '@arco-design/web-react';
import {
  IconLanguage,
  IconMoonFill,
  IconSunFill,
  IconMenuUnfold,
  IconMenuFold,
  IconUser,
  IconEdit,
  IconMenu,
  IconSearch,
  IconDelete,
  IconSend
} from '@arco-design/web-react/icon';
import { Switch, Route, Redirect, useHistory } from 'react-router-dom';
import styles from './style/layout.module.less';
import useLocale from '@/utils/useLocale';
import apiClient from '@/utils/apiService';
import { GlobalContext } from '@/context';
import defaultLocale from '@/locale';
import { clearCookie } from '@/utils/useCookies'; // 导入函数
import lazyload from '@/utils/lazyload';
import Logo from './assets/images/AcebergHelp_logo.png';
import Logomini from './assets/images/AcebergHelp_logomini.png';
import { useSelector } from 'react-redux';
import { GlobalState } from './store';
import useRoute, { IRoute } from '@/routes';
import { render } from 'react-dom'; // 添加此行以导入 render 函数
import { getCookie } from '@/utils/useCookies';
import useStorage from './utils/useStorage';
import MarkDown from './components/markdown';
import AnchorCustom from './components/anchorcustom';


function PageLayout() {
  const { settings, userLoading, userInfo } = useSelector(
    (state: GlobalState) => state
  );

  // 国际化
  const t = useLocale();
  // redux
  const { lang, setLang, theme, setTheme } = useContext(GlobalContext);

  const history = useHistory();


  const [routes, defaultRoute] = useRoute(userInfo?.permissions);
  function getFlattenRoutes(routes) {
    const res = [];
    function travel(_routes) {
      _routes.forEach((route) => {
        const visibleChildren = (route.children || []).filter(
          (child) => !child.ignore
        );
        if (route.key && (!route.children || !visibleChildren.length)) {
          try {
            route.component = lazyload(() => import(`./components/${route.key}`));
            res.push(route);
          } catch (e) {
            console.error(e);
          }
        }
        if (route.children && route.children.length) {
          travel(route.children);
        }
      });
    }
    travel(routes);
    return res;
  }



  const onExit = () => {
    // 清除 token
    clearCookie("token");
    // localStorage的userStatus登陆状态改为logout
    localStorage.setItem('userStatus', 'logout');
    // 清除userInfo
    localStorage.removeItem('userInfo');

    // 跳转到登录页
    history.push({
      pathname: '/login',
    });
  }

  // 多语言
  const currentLangRef = useRef(lang);
  useEffect(() => {
    if (currentLangRef.current !== lang) {
      currentLangRef.current = lang;
      const nextLang = defaultLocale[lang];
      Message.info(`${nextLang['message.lang.tips']}${lang}`);
    }
  }, [lang])

  // menu展开关闭
  const [collapse, setcollapse] = useState(false)


  // usr的下拉
  const dropList = (
    <Menu>
      <Menu.Item
        key='0'
        style={{
          fontSize: '12px',
        }}
        disabled
      >
        <IconUser /> Aceberg老王科技有限公司
      </Menu.Item>
      <Menu.Item
        key='1'
        style={{
          fontSize: '12px',
        }}
      >
        用户设置
      </Menu.Item>
      <Divider style={{ margin: '4px 0' }} />
      <Menu.Item
        key='2'
        style={{
          fontSize: '12px',
        }}
        onClick={onExit}>
        退出登录
      </Menu.Item>
    </Menu>
  );


  // 点击menu
  const pathname = history.location.pathname;
  const currentComponent = pathname.split('/').pop() || '/';

  const [activemenu, setactivemenu] = useState(currentComponent)

  const clickmenu = (v) => {
    setactivemenu(v)
    history.push({
      pathname: `/${v}`,
    })

    content_query(v)
  }

  const changetheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
    // const currenttheme = localStorage.getItem('theme')
    // changeTheme(currenttheme === 'light' ? 'dark' : 'light')
    // localStorage.setItem('theme',currenttheme=='dark'?'light':'dark')
  }

  const getRole = useCallback(() => {
    const role = localStorage.getItem('role')
    return role
  }, [])


  const [content, setcontent] = useState('')
  // 调接口获取content方法
  const content_query = (arg) => {
    const warntext = '请选择正确菜单！'
    try {
      apiClient.get(`/api/help_query/${arg}`).then((res) => {
        const { msg, status, data } = res.data;
        if (status === 'success') {
          setcontent(data)
        } else {
          setcontent(warntext)
        }
      }).catch((err) => {
        setcontent(warntext)
      });
    }
    catch (err) {
      setcontent(warntext)
    }

    searchform.resetFields()

  }

  useEffect(() => {
    content_query(activemenu)
  }, [])


  const content_update = (arg) => {
    try {
      apiClient.post(`/api/help_update/${arg}`,
        { content: mdform.getFieldValue('mdcontent') }
      ).then((res) => {
        const { msg, status, data } = res.data;
        if (status === 'success') {
          content_query(activemenu)
        } else {
          Message.error(msg);
        }
      }).catch((err) => {
        Message.error(`${err}`);
      });
    }
    catch (err) {
      Message.error(`${err}`);
    }
  }


  // 递归生成菜单
  const dgtomenu = (data) => {
    if (Array.isArray(data)) {
      return (
        <>
          {data.map((item) => {
            if (Array.isArray(item.children) && item.children.length > 0) {
              return (
                <Menu.SubMenu key={item.key} title={<>{item.name}</>}>
                  {dgtomenu(item.children)}
                </Menu.SubMenu>
              );
            } else {
              return (
                <Menu.Item key={item.key} onClick={() => clickmenu(item.key)}>
                  <span>{item.name}</span>
                </Menu.Item>
              );
            }
          })}
        </>
      );
    } else {
      if (Array.isArray(data.children) && data.children.length > 0) {
        return (
          <Menu.SubMenu key={data.key} title={<>{data.name}</>}>
            {dgtomenu(data.children)}
          </Menu.SubMenu>
        );
      } else {
        return (
          <Menu.Item key={data.key} onClick={() => clickmenu(data.key)}>
            <span>{data.name}</span>
          </Menu.Item>
        );
      }
    }
  };


  // Drawer
  const [drawervisible, setdrawervisible] = useState(false);
  const [mdform] = Form.useForm();
  const showdrawer = () => {
    setdrawervisible(true);
    mdform.setFieldValue('mdcontent', content);
  }


  // search
  const [searchform] = Form.useForm();
  const [searchres, setsearchres] = useState([]);
  const [searchresvisible, setsearchresvisible] = useState(false);

  const searchfunc = (v) => {
    if(v != ''){
      apiClient.post(`/api/content_query`,
        { content: v }
      ).then((res) => {
        const { msg, status, data } = res.data;
        if (status === 'success') {
          searchform.resetFields()

          setsearchres(data);
          setsearchresvisible(true);
        } else {
          Message.error(msg);
        }
      }).catch((err) => {
        Message.error(`${err}`);
      });
    }
    else {
      Message.warning('请输入搜索内容')
    }
  }


  return (
    <Layout className={styles.layout}>
      {userLoading ? (
        <Spin className={styles['spin']} />
      ) : (
        <Layout>

          <Layout className={styles['layout-content']}>
            <div className={styles['layout-content-wrapper']}>

              <div className={styles.container}>
                <div className={styles.home_menu} style={{ width: collapse ? 48 : 180, left: 0 }}>
                  <div className={styles.home_menu_logo}>
                    <Image width={collapse ? 40 : 120} src={collapse ? Logomini : Logo} preview={false} />
                  </div>
                  <div className={styles.home_menu_menu} style={{ width: collapse ? 48 : 180, }}>
                    <Menu
                      style={{ width: '100%' }}
                      defaultSelectedKeys={[activemenu]}
                      collapse={collapse}
                    >
                      {
                        dgtomenu(routes)
                      }

                    </Menu>
                  </div>
                  <Button
                    style={{
                      width: collapse ? 30 : 40,
                      height: collapse ? 30 : 40,
                      position: 'absolute',
                      left: collapse ? 10 : 160,
                      bottom: 80,
                      zIndex: 999
                    }}
                    type='primary'
                    shape='circle'
                    size='mini'
                    onClick={() => setcollapse(!collapse)}
                  >
                    {collapse ? <IconMenuUnfold /> : <IconMenuFold />}
                  </Button>
                </div>
                <div className={styles.home_right} style={{ width: collapse ? 'calc(100% - 48px)' : 'calc(100% - 180px)' }}>
                  <div className={styles.home_nav}>

                    <div className={styles.home_nav_left}>
                    <Form
                      form={searchform}
                    >
                      <Form.Item
                        label=""
                        field="searchcontent"
                        style={{ margin: 0,padding:0 }}
                        labelCol={{span: 0}}
                        wrapperCol={{span:22}}
                      >
                        <Input
                          placeholder='请输入内容'
                          autoComplete='off'
                          allowClear
                        />
                      </Form.Item>
                    </Form>
                    <Button
                      style={{ width: 28, height: 28 }}
                      icon={<IconSearch />}
                      onClick={() => {
                        searchfunc(searchform.getFieldValue('searchcontent'))
                      }}
                    />
                  
                    </div>

                    <div className={styles.home_nav_right}>
                      <Button
                        style={{ width: 28, height: 28 }}
                        icon={<IconLanguage />}
                        onClick={() => setLang(lang === 'en-US' ? 'zh-CN' : 'en-US')}
                      />

                      <Button
                        style={{ width: 28, height: 28 }}
                        icon={theme !== 'dark' ? <IconMoonFill /> : <IconSunFill />}
                        onClick={changetheme}
                      />

                      {getRole() == 'admin' ?
                        <Button
                          style={{ width: 28, height: 28, }}
                          icon={<IconEdit />}
                          onClick={() => {
                            showdrawer()
                          }}
                        /> : <></>
                      }


                      <Dropdown droplist={dropList} position='br'>
                        <div className={styles.home_nav_usr}>
                          {'Aceberg'.slice(0, 1).toUpperCase()}
                        </div>
                      </Dropdown>

                    </div>

                  </div>


                  <div className={styles.home_content}>
                    <div className={styles.home_content_content}>
                      <MarkDown content={content} />
                    </div>
                    {/* 锚点 */}
                    <div className={styles.home_content_anchor}>
                      <AnchorCustom content={content} />
                    </div>
                  </div>
                  <div className={styles.home_footer}>AcebergHelp By Aceberg</div>
                </div>
              </div>


              {/* 编辑文本的抽屉 */}
              <Drawer
                width={420}
                title={<span>MarkDown Edit</span>}
                visible={drawervisible}
                onOk={() => {
                  content_update(activemenu)
                  setdrawervisible(false);
                }}
                onCancel={() => {
                  setdrawervisible(false);
                }}
              >
                <Form
                  form={mdform}
                  labelCol={{ span: 0 }}
                  wrapperCol={{ span: 24 }}
                >
                  <Form.Item label="mdcontent" field="mdcontent">
                    <Input.TextArea
                      placeholder="markdown content"
                      autoSize={{
                        minRows: 16,
                        maxRows: 24
                      }
                      }
                    />
                  </Form.Item>
                </Form>
              </Drawer>


              <Modal
                style={{ padding: '20px 0',width: '60%', maxHeight: 500 }}
                visible={searchresvisible}
                onOk={()=>{
                  setsearchresvisible(false)
                }}
                onCancel={() => {
                  setsearchresvisible(false);
                }}
              >
                 <List
                  style={{ maxHeight: 320, overflowY: 'auto' }}
                  render={()=>(
                    <span className='list-demo-actions-icon'>
                      <IconSend />
                    </span>
                  )}
                >
                  {searchres.map((item)=>{
                    return (
                      <List.Item
                        key={item.key}
                        style={{display:'flex', flexDirection:'row', justifyContent:'space-between'}}
                      >
                      <List.Item.Meta
                        title={item.key}
                        description={`${item.content?.slice(0,40)}...`}
                      />
                      
                      <Button
                        style={{position:'relative', left:'calc(100% - 40px)'}}
                        icon={<IconSend />}
                        onClick={()=>{
                        setsearchresvisible(false)
                        clickmenu(item.key)
                        }}
                      />
                    </List.Item>
                    )
                  }
                  )}
                  </List>

              </Modal>



            </div>
          </Layout>
        </Layout>
      )}
    </Layout>
  );
}

export default PageLayout;
