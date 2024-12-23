export default {
    async fetch(request, env) {
        const urls = (env.URL || "").split("\n").map(url => url.trim()).filter(url => url !== "");

        if (urls.length === 0) {
            return new Response(
                "You have not set any URLs. Please provide URLs to fetch data.\n",
                { headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
            );
        }

        const allLinks = await Promise.all(urls.map(url => fetchLinks(url)));

        const validLinks = allLinks.flat().filter(link => link);

        if (validLinks.length === 0) {
            return new Response("No valid links found.\n", { status: 500 });
        }

        // 按国家分组，提取每个国家最多5个链接
        const selectedLinks = selectTopFiveByCountry(validLinks);

        // 替换第一行的 #国家代码 为 #极链提供
        if (selectedLinks.length > 0) {
            selectedLinks[0] = selectedLinks[0].replace(/#\w+$/, "#极链提供https://t.me/jiliankeji");
        }

        const plainTextContent = selectedLinks.join('\n');
        return new Response(plainTextContent + "\n", {
            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });
    }
};

async function fetchLinks(url) {
    let base64Data;
    try {
        base64Data = await fetch(url).then(res => res.text());
    } catch (err) {
        console.error(`Failed to fetch from ${url}:`, err);
        return [];
    }

    if (!base64Data) {
        return [];
    }

    let decodedContent;
    try {
        decodedContent = atob(base64Data);
    } catch (e) {
        console.error("Failed to decode the content:", e);
        return [];
    }

    decodedContent = decodeURIComponent(decodedContent);
    return extractLinks(decodedContent);
}

function extractLinks(decodedContent) {
    const regex = /vless:\/\/([a-zA-Z0-9\-]+)@([^:]+):(\d+)\?([^#]+)#([^\n]+)/g;
    const links = [];
    const countryMapping = {
        "香港": "HK",
        "韩国": "KR",
        "台湾": "TW",
        "日本": "JP",
        "新加坡": "SG",
        "美国": "US",
        "加拿大": "CA",
        "澳大利亚": "AU",
        "英国": "GB",
        "法国": "FR",
        "意大利": "IT",
        "荷兰": "NL",
        "德国": "DE",
        "挪威": "NO",
        "芬兰": "FI",
        "瑞典": "SE",
        "丹麦": "DK",
        "立陶宛": "LT",
        "俄罗斯": "RU",
        "印度": "IN",
        "土耳其": "TR",
        "捷克": "CZ",
        "爱沙尼亚": "EE",
        "拉脱维亚": "LV",
        "都柏林": "IE",
        "西班牙": "ES",
        "奥地利": "AT", 
        "罗马尼亚": "RO",
        "波兰": "PL"
    };

    let match;
    while ((match = regex.exec(decodedContent)) !== null) {
        const ip = match[2];
        const port = match[3];
        let countryCode = match[5];

        // 映射国家
        for (let country in countryMapping) {
            if (countryCode.includes(country)) {
                countryCode = countryMapping[country];
                break;
            }
        }

        // 去除#后面的特殊字符和文本
        countryCode = countryCode.replace(/[^A-Za-z]/g, '');

        // 确保 countryCode 不为空
        if (!countryCode) {
            console.warn("Country code is empty or invalid, skipping this entry.");
            continue;
        }

        const formattedLink = `${ip}:${port}#${countryCode}`;
        links.push({ link: formattedLink, countryCode });
    }

    return links.filter(link => link.link.includes("#"));
}

// 按国家分组并提取每个国家的前5个链接
function selectTopFiveByCountry(links) {
    const countryOrder = [
        "US", "KR", "TW", "JP", "SG", "HK", "CA", "AU", "GB", "FR", "IT",
        "NL", "DE", "NO", "FI", "SE", "DK", "LT", "RU", "IN", "TR",
        "CZ", "EE", "LV", "IE", "ES", "AT", "RO", "PL"
    ];

    const groupedLinks = {};

    // 分组链接
    links.forEach(({ link, countryCode }) => {
        if (!groupedLinks[countryCode]) {
            groupedLinks[countryCode] = [];
        }
        groupedLinks[countryCode].push(link);
    });

    // 提取每个国家的前5个链接
    const result = [];
    countryOrder.forEach(country => {
        if (groupedLinks[country]) {
            const linksForCountry = groupedLinks[country];
            // 只取前5个链接
            result.push(...linksForCountry.slice(0, 5));
        }
    });

    return result;
}
