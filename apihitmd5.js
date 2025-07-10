const WebSocket = require("ws");
const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

let phienTruoc = null;
let phienKeTiep = null;

const WS_URL = "wss://mynygwais.hytsocesk.com/websocket";

function connectWebSocket() {
    const ws = new WebSocket(WS_URL);

    ws.on("open", () => {
        console.log("[+] WebSocket đã kết nối");

        const authPayload = [
            1,
            "MiniGame",
            "",
            "",
            {
                agentId: "1",
                accessToken: "1-951105cee835343eeb1912721b22a5e7",
                reconnect: false
            }
        ];
        ws.send(JSON.stringify(authPayload));
        console.log("[>] Đã gửi xác thực");

        setTimeout(() => {
            const cmdPayload = [
                6,
                "MiniGame",
                "taixiuKCBPlugin",
                { cmd: 2001 }
            ];
            ws.send(JSON.stringify(cmdPayload));
            console.log("[>] Đã gửi cmd 2001");
        }, 1000);
    });

    ws.on("message", (message) => {
        try {
            const data = JSON.parse(message);
            if (Array.isArray(data) && data.length === 2 && data[0] === 5 && typeof data[1] === "object") {
                const d = data[1].d;

                if (typeof d === "object") {
                    const cmd = d.cmd;
                    const sid = d.sid;
                    const md5 = d.md5;

                    if (cmd === 2006 && d.d1 !== undefined && d.d2 !== undefined && d.d3 !== undefined) {
                        const { d1, d2, d3 } = d;
                        const total = d1 + d2 + d3;
                        const result = total >= 11 ? "Tài" : "Xỉu";

                        phienTruoc = {
                            phien: sid,
                            xuc_xac_1: d1,
                            xuc_xac_2: d2,
                            xuc_xac_3: d3,
                            tong: total,
                            ket_qua: result,
                            md5
                        };

                        console.log(`🎲 Phiên ${sid}: ${d1}-${d2}-${d3} = ${total} ➜ ${result}`);
                        console.log(`🔐 MD5: ${md5}`);
                    }

                    if (cmd === 2005) {
                        phienKeTiep = {
                            phien: sid,
                            md5
                        };

                        console.log(`⏭️ Phiên kế tiếp: ${sid} | MD5: ${md5}`);
                    }
                }
            }
        } catch (err) {
            console.error("[!] Lỗi:", err.message);
        }
    });

    ws.on("close", () => {
        console.log("[x] WS bị đóng. Tự kết nối lại sau 3s...");
        setTimeout(connectWebSocket, 3000);
    });

    ws.on("error", (err) => {
        console.error("[!] WebSocket lỗi:", err.message);
    });
}

connectWebSocket();

// ✅ API Express trả JSON
app.get("/", (req, res) => {
    res.json({
        phien_truoc: phienTruoc,
        phien_ke_tiep: phienKeTiep,
        thoi_gian: new Date().toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })
    });
});

// 🔄 Ping chống sleep Render
setInterval(() => {
    console.log("💤 Ping giữ Render hoạt động...");
}, 1000 * 60 * 5);

// 🚀 Khởi động server
app.listen(PORT, () => {
    console.log(`✅ API đang chạy tại http://localhost:${PORT}`);
});
