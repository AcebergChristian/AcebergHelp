# -*- coding: utf-8 -*-

from flask import Flask, jsonify, request
from flask_jwt_extended import JWTManager, get_jwt_identity, verify_jwt_in_request
from flask_jwt_extended.exceptions import NoAuthorizationError, InvalidHeaderError, RevokedTokenError
from utils.sql import SQLiteClass
from functools import wraps
import os
from werkzeug.utils import secure_filename
import datetime
from functools import wraps
import time
from playwright.sync_api import sync_playwright
import requests
from uuid import uuid4



# 自定义装饰器来验证 token
def validate_token(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        try:
            # 验证 token 的有效性
            verify_jwt_in_request()
            # 获取当前用户的 ID
            current_user = get_jwt_identity()
            with SQLiteClass("aceberghelp.db") as cursor:
                user = cursor.select_data("users", condition="account='{}'".format(current_user))
            if not user:
                return jsonify({'msg': 'Data no exists!'}), 401
    
        except NoAuthorizationError:
            # 如果没有提供 token
            return jsonify({"msg": "Missing token"}), 401
        except InvalidHeaderError:
            # 如果 token 的头部无效
            return jsonify({"msg": "Invalid JWT header"}), 401
        # except ExpiredSignatureError:
        #     # 如果 token 已经过期
        #     return jsonify({"msg": "Token has expired"}), 401
        except RevokedTokenError:
            # 如果 token 已经被撤销
            return jsonify({"msg": "Token has been revoked"}), 401
        except Exception as e:
            # 其他类型的错误
            return jsonify({"msg": str(e)}), 401

        return func(*args, **kwargs)
    return wrapper



# 验证上传的文件格式
ALLOWED_EXTENSIONS = {'txt', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'pptx', 'ppt','md'}  # 允许的文件扩展名
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS



# 上传文件到指定文件夹方法和生成向量数据库的方法
def savefile(files, key):
    try:
        UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), '../../uploads_folder/upload_{}'.format(key))
        if not os.path.exists(UPLOAD_FOLDER):
            os.makedirs(UPLOAD_FOLDER)
        
        for file in files:
            filename = file.filename
            file.save(os.path.join(UPLOAD_FOLDER, filename))
        return True
    except Exception as e:
        print(e)
        return False
    
    
# /toolsfolder里，创建py文件
def create_py_file(file_name, defaultcode):
    try:
        if not os.path.exists('toolsfolder'):
            os.makedirs('toolsfolder', exist_ok=True)  # 确保目录存在
        with open(f'toolsfolder/{file_name}', 'w') as f:
            f.write(defaultcode)
        return True
    except Exception as e:
        print(e)
        return False


            
# /toolsfolder里，更新py文件
def update_py_file(file_name, toolcode):
    try:
        with open(f'toolsfolder/{file_name}', 'w') as f:
            f.write(toolcode)
        return True
    except Exception as e:
        print(e)
        return False
    
    

def interval_action(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        try:
            res = func(*args, **kwargs)  # 执行 func
            time.sleep(5)  # 在 
        except Exception as e:
            # 其他类型的错误
            return 'error'

        return res
    return wrapper



data = [
        {"key": "1", "step": "打开链接", "action": "openurl", "element": "#su", "content": "https://baidu.com"}, 
        {"key": "2", "step": "输入都条件", "action": "input", "element": "#kw", "content": "莫兰特"},
        {"key": "3", "step": "点击搜索按钮", "action": "click", "element": "#su", "content": ""},
        {"key": "4", "step": "判断存在", "action": "exist", "element": "#tsn_inner > div:nth-child(2)", "content": "xxx"}
        ]




class ActionGo:
    def __init__(self, playwright):
        self.playwright = playwright
        chromium_executable_path = 'Chromium/Chromium.app/Contents/MacOS/Chromium'
        # 启动浏览器
        browser = self.playwright.chromium.launch(
            headless=False,  # 设置为 False 以显示浏览器窗口
            executable_path=chromium_executable_path  # 指定 Chromium 可执行文件路径
        )
        self.context = browser.new_context()
        self.page = self.context.new_page()
        

    @interval_action
    def __call__(self, action, ele, content):
        self.action = action
        self.ele = ele
        self.content = content
        
        # 根据 self.action 反射获取方法
        toaction = getattr(self, self.action)()
        return toaction
    
    def exist(self):
        print('exist========>')
        ele_isExists = self.page.is_visible( self.ele )
        print(f"元素 {self.ele} 是否存在: {ele_isExists}")
        return ele_isExists
    
    def openurl(self):
        print('openurl========>')
        self.page.goto( self.content )

    def click(self):
        print('click========>')
        self.page.click( self.ele )
    
    def dblclick(self):
        print('dblclick========>')
        self.page.dblclick( self.ele )
        
    def input(self):
        print('input========>')
        self.page.fill( self.ele , self.content)
    


# with sync_playwright() as playwright:
#     action = ActionGo(playwright)
#     for item in data:
#         action(item['action'],item['element'],item['content'])


# 调接口方法
def requestApi(args):
    try:
        # headers = {
        #     'Content-Type': 'application/json',
        #     'Authorization': f'Bearer {args['token']}'
        # }
        request = requests.get( args['path'] ) if args['method'] == 'GET' else requests.post(args['path'],data=args['body'])
        statuscode = request.status_code
        return statuscode == int(args['statuscode'])
        
    except Exception as e:
        print('接口调用失败', e)
        return str(e)
    

def runtores(args):
    key = str(uuid4())
    current_user = get_jwt_identity()
    time = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    newarg = {
        'key': key,
        'casekey': args.get("key", ""),
        'product':args.get("product", ""),
        'module':args.get("module", ""),
        'casetype':args.get("casetype", ""),
        'stage':args.get("stage", ""),
        'title': args.get("title", ""),
        'priority':args.get("priority", ""),
        'precondition':args.get("precondition", ""),
        'testtype': args.get("testtype", ""),
        'testres': args.get("testres", ""),
        'testcontent': args.get("testcontent", ""),
        'isdel':'0',
        'creator':current_user,
        'createtime': time,
    }
    
    with SQLiteClass("aceberghelp.db") as cursor:
        data = cursor.insert_data("cases_res", newarg)
    print('run to res', data)
    
    
    