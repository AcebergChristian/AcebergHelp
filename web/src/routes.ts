import auth, { AuthParams } from '@/utils/authentication';
import { useEffect, useMemo, useState } from 'react';

export type IRoute = AuthParams & {
  name: string;
  key: string;
  // 当前页是否展示面包屑
  breadcrumb?: boolean;
  children?: Array<{
    name: string;
    key: string;
    children?: Array<{
      name: string;
      key: string;
      children?: Array<{
        name: string;
        key: string;
      }>
    }>
  }>;
  // 当前路由是否渲染菜单项，为 true 的话不会在菜单中显示，但可通过路由地址访问。
  ignore?: boolean;
};


export const routes: IRoute[] = [
  {
    name: '系统使用手册',
    key: 'syshelp',
    children: [
      {
        name: '使用指南',
        key: 'useguide',
        children: [
          {
            name: '入门必读',
            key: 'firstread',
            children: [
              {
                name: '1025更新',
                key: '1025update',
              },
              {
                name: '1026更新',
                key: '1026update',
              },
            ]
          },
          {
            name: '管理员手册',
            key: 'adminbook',
            children: [
              {
                name: '基础操作',
                key: 'adminoperation',
              },
              {
                name: '热门问题',
                key: 'adminheatquestion',
              },
            ]
          },
          {
            name: '用户手册',
            key: 'usrbook',
            children: [
              {
                name: '基础操作',
                key: 'usroperation',
              },
              {
                name: '热门问题',
                key: 'usrheatquestion',
              },
            ]
          }
        ]
      }
    ]
  },
  {
    name: 'bugs',
    key: 'bugs',
    children: [
      {
        name: '1020bug',
        key: '1020bug',
      },
      {
        name: '1021bug',
        key: '1021bug',
      },
    ]
  },
  {
    name: 'Projects',
    key: 'usrhelp',
  },
]

export const getName = (path: string, routes)=>{
  return routes.find((item) => {
    const itemPath = `/${item.key}`;
    if (path === itemPath) {
      return item.name;
    } else if (item.children) {
      return getName(path, item.children);
    }
  });
};

export const generatePermission = (role: string) => {
  const actions = role === 'admin' ? ['*'] : ['read'];
  const result = {};
  routes.forEach((item) => {
    if (item.children) {
      item.children.forEach((child) => {
        result[child.name] = actions;
      });
    }
  });
  return result;
};

const useRoute = (userPermission): [IRoute[], string] => {
  
  const filterRoute = (routes, arr = []): IRoute[] => {
    if (!routes.length) {
      return [];
    }
    for (const route of routes) {
      const { requiredPermissions, oneOfPerm } = route;
      let visible = true;
      if (requiredPermissions) {
        visible = auth({ requiredPermissions, oneOfPerm }, userPermission);
      }

      if (!visible) {
        continue;
      }
      if (route.children && route.children.length) {
        const newRoute = { ...route, children: [] };
        filterRoute(route.children, newRoute.children);
        if (newRoute.children.length) {
          arr.push(newRoute);
        }
      } else {
        arr.push({ ...route });
      }
    }

    return arr;
  };

  const [permissionRoute, setPermissionRoute] = useState(routes);

  useEffect(() => {
    const newRoutes = filterRoute(routes);
    setPermissionRoute(newRoutes);
  }, [JSON.stringify(userPermission)]);

  const defaultRoute = useMemo(() => {
    const first = permissionRoute[0];
    if (first) {
      const firstRoute = first?.children?.[0]?.key || first.key;
      return firstRoute;
    }
    return '';
  }, [permissionRoute]);

  return [permissionRoute, defaultRoute];
};

export default useRoute;


