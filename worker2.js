let domainList = [];  // 存储多个域名
let userList = [];    // 存储多个账号
let passList = [];    // 存储多个密码
let 签到信息 = '';    // 存储签到信息（包括错误信息）
let BotToken = '';
let ChatID = '';

export default {
  // HTTP 请求处理函数
  async fetch(request, env, ctx) {
    await initializeVariables(env);
    const url = new URL(request.url);
    if(url.pathname == "/tg") {
      await sendMessage();
    } else {
      await checkin(); // 默认处理签到
    }
    return new Response(签到信息, {
      status: 200,
      headers: { 'Content-Type': 'text/plain;charset=UTF-8' }
    });
  },

  // 定时任务处理函数
  async scheduled(controller, env, ctx) {
    console.log('Cron job started');
    try {
      await initializeVariables(env);
      await checkin();
      console.log('Cron job completed successfully');
    } catch (error) {
      console.error('Cron job failed:', error);
      签到信息 = `定时任务执行失败: ${error.message}`;
      await sendMessage(签到信息);
    }
  },
};

async function initializeVariables(env) {
  // 从环境变量中获取账号、密码和域名信息
  domainList = (env.JC || "").split(",");
  userList = (env.ZH || "").split(",");
  passList = (env.MM || "").split(",");
  BotToken = env.TGTOKEN || BotToken;
  ChatID = env.TGID || ChatID;

  if(domainList.length === 0 || userList.length === 0 || passList.length === 0) {
    throw new Error('JC、ZH、MM 环境变量配置错误');
  }

  // 显示部分账户信息
  签到信息 = `账户信息: \n${domainList.map((domain, index) => `地址: ${domain}\n账号: ${userList[index]}\n密码: <tg-spoiler>${passList[index]}</tg-spoiler>`).join("\n\n")}`;
}

async function sendMessage(msg = "") {
  const now = new Date();
  const beijingTime = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  const formattedTime = beijingTime.toISOString().slice(0, 19).replace('T', ' ');

  // 如果配置了 Telegram 推送
  if (BotToken !== '' && ChatID !== '') {
    const url = `https://api.telegram.org/bot${BotToken}/sendMessage?chat_id=${ChatID}&parse_mode=HTML&text=${encodeURIComponent("执行时间: " + formattedTime + "\n" + 签到信息 + "\n\n" + msg)}`;
    
    return fetch(url, {
      method: 'get',
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;',
        'Accept-Encoding': 'gzip, deflate, br',
        'User-Agent': 'Mozilla/5.0 Chrome/90.0.4430.72',
      }
    });
  }
}

async function checkin(index = null) {
  try {
    if (domainList.length === 0 || userList.length === 0 || passList.length === 0) {
      throw new Error('必需的配置参数缺失');
    }

    const start = index === null ? 0 : index;  // 如果没有传入index，就处理所有账号；否则处理指定账号
    const end = index === null ? domainList.length : start + 1;

    签到信息 = "";  // 在每次开始签到时清空签到信息

    for (let i = start; i < end; i++) {
      const domain = domainList[i];
      const user = userList[i];
      const pass = passList[i];

      // 登录请求
      const loginResponse = await fetch(`${domain}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
          'Accept': 'application/json, text/plain, */*',
          'Origin': domain,
          'Referer': `${domain}/auth/login`,
        },
        body: JSON.stringify({
          email: user,
          passwd: pass,
          remember_me: 'on',
          code: "",
        }),
      });

      console.log(`账号 ${i + 1} - 登录请求状态:`, loginResponse.status);

      if (!loginResponse.ok) {
        const errorText = await loginResponse.text();
        throw new Error(`账号 ${i + 1} 登录请求失败: ${errorText}`);
      }

      const loginJson = await loginResponse.json();
      console.log(`账号 ${i + 1} - 登录响应:`, loginJson);

      if (loginJson.ret !== 1) {
        throw new Error(`账号 ${i + 1} 登录失败: ${loginJson.msg || '未知错误'}`);
      }

      // 获取 Cookie
      const cookieHeader = loginResponse.headers.get('set-cookie');
      if (!cookieHeader) {
        throw new Error(`账号 ${i + 1} 登录成功但未收到Cookie`);
      }

      console.log(`账号 ${i + 1} - 收到Cookie:`, cookieHeader);
      const cookies = cookieHeader.split(',').map(cookie => cookie.split(';')[0]).join('; ');

      // 等待确保登录状态
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 签到请求
      const checkinResponse = await fetch(`${domain}/user/checkin`, {
        method: 'POST',
        headers: {
          'Cookie': cookies,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
          'Accept': 'application/json, text/plain, */*',
          'Content-Type': 'application/json',
          'Origin': domain,
          'Referer': `${domain}/user/panel`,
          'X-Requested-With': 'XMLHttpRequest'
        },
      });

      console.log(`账号 ${i + 1} - 签到请求状态:`, checkinResponse.status);

      const responseText = await checkinResponse.text();
      console.log(`账号 ${i + 1} - 签到响应:`, responseText);

      try {
        const checkinResult = JSON.parse(responseText);
        console.log(`账号 ${i + 1} - 签到结果:`, checkinResult);

        if (checkinResult.ret === 1 || checkinResult.ret === 0) {
          签到信息 += `🎉 账号 ${i + 1} 签到结果 🎉\n ${checkinResult.msg || (checkinResult.ret === 1 ? '签到成功' : '签到失败')}\n`;
        } else {
          签到信息 += `🎉 账号 ${i + 1} 签到结果 🎉\n ${checkinResult.msg || '签到结果未知'}\n`;
        }
      } catch (e) {
        console.error(`账号 ${i + 1} - 解析签到响应失败:`, e);
        签到信息 += `账号 ${i + 1} 签到解析失败: ${e.message}\n`;
      }
    }

    // 发送签到结果信息（包括账户信息和签到结果）
    await sendMessage(签到信息);

    return 签到信息;

  } catch (error) {
    console.error('Checkin Error:', error);
    签到信息 = `签到过程发生错误: ${error.message}`;
    await sendMessage(签到信息);
    return 签到信息;
  }
}
