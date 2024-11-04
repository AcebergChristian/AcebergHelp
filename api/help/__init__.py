from flask import Blueprint, render_template, request, jsonify
from flask import Flask, jsonify, request
from flask_jwt_extended import get_jwt_identity
from werkzeug.utils import secure_filename
from utils.sql import SQLiteClass
from functools import wraps
from utils.common import validate_token
import json
import datetime
from uuid import uuid4


help_blueprint = Blueprint("help_module", __name__)


# help 组件里创建接口
@help_blueprint.route("/help_create", methods=["POST"])
@validate_token
def help_create():
    # 获取参数
    params = json.loads(request.data.decode("utf-8"))

    key = str(uuid4())
    product= params.get('product', '')
    module = params.get('module', '')
    version = params.get('version', '')
    assigner = params.get('assigner', '')
    enddatetime = params.get('enddatetime', '')
    feedbackor = params.get('feedbackor', '')
    mail = params.get('mail', '')
    bugtype = params.get('bugtype', '')
    system = params.get('system', '')
    browser = params.get('browser', '')
    title = params.get('title', '')
    bugcontent = params.get('bugcontent', '')
    demand = params.get('demand', '')
    ccto = params.get('ccto', '')
        
    
    # 获取当前用户的 ID
    current_user = get_jwt_identity()
    time = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    newhelp = {
        'key': key,
        'product': product,
        'module': module,
        'version': version,
        'assigner': assigner,
        'enddatetime': enddatetime,
        'feedbackor': feedbackor,
        'mail': mail,
        'bugtype': bugtype,
        'system': system,
        'browser': browser,
        'title': title,
        'bugcontent': bugcontent,
        'demand': demand,
        'ccto': ccto,
        'isdel':'0',
        'creator':current_user,
        'createtime': time,
    }
    print('============>', newhelp)
  
    try:
        with SQLiteClass("aceberghelp.db") as cursor:
            rows_affected = cursor.insert_data("help", newhelp) 
        if rows_affected > 0:
            response = jsonify({"msg": "Create Data Success!", "status": "success"})
        else:
            response = jsonify({"msg": "Create Error!", "status": "error" })
        response.status_code = 200
        response.headers["Content-Type"] = "application/json; charset=utf-8"
            
    except Exception as e:
        response = jsonify({"msg": str(e), "status": "error", "data": str(e)})
        response.status_code = 200
        response.headers["Content-Type"] = "application/json; charset=utf-8"

    return response


@help_blueprint.route("/help_query/<path:path>", methods=["GET"])
@validate_token
def help_query(path):
    print(path)
    # 获取当前用户的 ID
    current_user = get_jwt_identity()
    try:
        with SQLiteClass("aceberghelp.db") as cursor:
            data = cursor.select_data('help', condition="isdel='0' and path='{}'".format(path))
        if data:
            response = jsonify({"msg": "Query Success! ", "status": "success", "data": data[0]['content']})
            response.status_code = 200
            response.headers["Content-Type"] = "application/json; charset=utf-8"
        else:
            response = jsonify({"msg": "Query Error!", "status": "error", "data":'暂无数据'})
            response.status_code = 200
            response.headers["Content-Type"] = "application/json; charset=utf-8"
    except Exception as e:
        print(str(e))
        response = jsonify({"msg": str(e), "status": "error", "data": str(e)})
        response.status_code = 200
        response.headers["Content-Type"] = "application/json; charset=utf-8"


    return response


# 更新接口
@help_blueprint.route("/help_update/<path:path>", methods=["POST"])
@validate_token
def help_update(path):
    # 获取参数
    params = json.loads(request.data.decode("utf-8"))
    title = params.get("title", "")
    content = params.get("content", "")
    creator = get_jwt_identity()
    arg = {
        "content": content
    }
    
    try:
        with SQLiteClass("aceberghelp.db") as cursor:
            query = cursor.select_data("help", condition="key='{}'".format(path))
            if query:
                data = cursor.update_data("help", arg, condition="key='{}'".format(path))
                if data:
                    response = jsonify({"msg": "Update Success! ", "status": "success"})
                else:
                    response = jsonify({"msg": "Update Error! ", "status": "error"})
            else:
                newhelp = {
                    "key": path,
                    "title": title,
                    "path": path,
                    "content": content,
                    "creator":creator,
                    "createtime": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                    "isdel": "0"
                }
                add = cursor.insert_data("help", newhelp)
                if add:
                    response = jsonify({"msg": "Add Success! ", "status": "success"})
                else:
                    response = jsonify({"msg": "Add Error! ", "status": "error"})
            
    except Exception as e:
        response = jsonify({"msg": str(e), "status": "error", "data": str(e)})
        response.headers["Content-Type"] = "application/json; charset=utf-8"
    
    
    response.status_code = 200

    return response


# 删除接口
@help_blueprint.route("/help_del", methods=["POST"])
@validate_token
def help_del():
    # 获取参数
    params = json.loads(request.data.decode("utf-8"))
    
    key = params.get("key", None)
    
    try:
        with SQLiteClass("aceberghelp.db") as cursor:
            data = cursor.update_data("help", {'isdel' : '1'}, condition="key='{}'".format(key))

        response = jsonify({"msg": "Delete Success! ", "status": "success", "data": data})
        response.status_code = 200
        response.headers["Content-Type"] = "application/json; charset=utf-8"
    except Exception as e:
        response = jsonify({"msg": str(e), "status": "error", "data": str(e)})
        response.status_code = 200
        response.headers["Content-Type"] = "application/json; charset=utf-8"

    return response



# 内容查询接口
@help_blueprint.route("/content_query", methods=["POST"])
@validate_token
def content_query():
    params = json.loads(request.data.decode("utf-8"))
    content = params.get("content", "")
    
    try:
        with SQLiteClass("aceberghelp.db") as cursor:
            data = cursor.select_data("help", 'key, content', condition=" isdel='0' and content like '%{}%' ".format(content))
            
        # res = [ item['account'] for item in data]
        print(data)
        response = jsonify({"msg": "Query Success! ", "status": "success", "data": data})
        response.status_code = 200
        response.headers["Content-Type"] = "application/json; charset=utf-8"
    except Exception as e:
        response = jsonify({"msg": str(e), "status": "error", "data": str(e)})
        response.status_code = 200
        response.headers["Content-Type"] = "application/json; charset=utf-8"


    return response