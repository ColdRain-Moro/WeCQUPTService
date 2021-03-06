import schedule from 'node-schedule';
import fs from 'fs';
import { useGithubAction, studentId, name, password, tyCode, sex } from './secrets.js';
import { getRequestObj, keymrdk } from './consts.js';
import { bind, getMrdkFlag, postMrdkInfo } from './api.js';
import { randomUUID } from 'crypto';

console.log("程序已启动")

async function job() {
    const openid = fs.readFileSync('./openid.txt', 'utf8')
    const d = new Date()
    const key = keymrdk(d.getDay(), d.getHours())
    const req = getRequestObj(name, studentId, sex, openid, key, d.getTime() / 1000)
    const flag = await getMrdkFlag(studentId, openid, new Date().getTime() / 1000)
    // 已经打卡 返回
    if (flag.data != null && flag.data.count != "0") {
        console.log("已经打过卡了")
        return
    }
    let res = await postMrdkInfo(req)
    if (res.status != 200) {
        const id = randomUUID().replace("-", "")
        const r = await bind(openid, tyCode, password, new Date().getTime() / 1000)
        if (r.status != 200) {
            console.log(`账号或密码错误!`)
            return
        }
        fs.writeFileSync('./openid.txt', id, 'utf8')
        const req = getRequestObj(name, studentId, sex, id, key, d.getTime() / 1000)
        res = await postMrdkInfo(req)
    }
    console.log("已打卡")
}

if (useGithubAction) {
    // 使用github action 自带的定时执行功能
    job()
} else {
    // 每天12点打卡
    schedule.scheduleJob('0 0 12 * * *', job);
}
