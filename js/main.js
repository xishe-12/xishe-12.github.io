// 等待DOM加载完成
document.addEventListener('DOMContentLoaded', function() {
    // 计算认识天数并实时更新
    function updateDaysCount() {
        const daysCount = document.getElementById('days-count');
        
        // 设置认识的开始时间：2024年12月16日00:08分
        const startDate = new Date('2024-12-16T00:08:00');
        const now = new Date();
        
        // 计算时间差（毫秒）
        const timeDiff = Math.abs(now.getTime() - startDate.getTime());
        
        // 将毫秒转换为天数（向上取整）
        const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
        
        // 更新页面上的天数
        daysCount.textContent = daysDiff;
        
        // 更新当前日期
        const currentDate = document.getElementById('current-date');
        const year = now.getFullYear();
        const month = now.getMonth() + 1;
        const day = now.getDate();
        currentDate.textContent = `${year} / ${month} / ${day}`;
    }
    
    // 初始调用一次更新天数
    updateDaysCount();
    
    // 每秒更新一次天数（如果需要更精确的实时更新）
    setInterval(updateDaysCount, 1000);
    
    // 获取重庆铜梁的天气数据
    function fetchWeatherData() {
        // 高德天气API的URL，使用重庆铜梁的adcode: 500151
        // 参考：https://lbs.amap.com/api/webservice/download
        const weatherApiUrl = 'https://restapi.amap.com/v3/weather/weatherInfo';
        const apiKey = '7aba9789edd4e655c05037f47adffe44';
        const city = '500151'; // 重庆铜梁的adcode
        const extensions = 'all'; // 获取预报天气
        
        // 构建完整的API请求URL
        const url = `${weatherApiUrl}?key=${apiKey}&city=${city}&extensions=${extensions}`;
        
        // 发送API请求
        fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error('网络响应不正常');
                }
                return response.json();
            })
            .then(data => {
                console.log('天气数据:', data);
                
                // 检查API返回是否成功
                if (data.status === '1' && data.forecasts && data.forecasts.length > 0) {
                    // 更新天气预报
                    updateWeatherForecast(data.forecasts[0]);
                    
                    // 获取实时天气数据
                    fetchLiveWeather(apiKey, city);
                } else {
                    console.error('获取天气预报失败:', data.info);
                }
            })
            .catch(error => {
                console.error('获取天气数据出错:', error);
            });
    }
    
    // 获取实时天气数据
    function fetchLiveWeather(apiKey, city) {
        const liveWeatherUrl = `https://restapi.amap.com/v3/weather/weatherInfo?key=${apiKey}&city=${city}`;
        
        fetch(liveWeatherUrl)
            .then(response => response.json())
            .then(data => {
                console.log('实时天气数据:', data);
                
                if (data.status === '1' && data.lives && data.lives.length > 0) {
                    // 更新天气提醒
                    updateWeatherReminder(data.lives[0]);
                }
            })
            .catch(error => {
                console.error('获取实时天气数据出错:', error);
            });
    }
    
    // 更新天气预报
    // 更新天气预报
    // 新增：获取污染指数的函数
    function fetchPollutionData(lat, lon, callback) {
        // 小米天气接口需要经纬度参数
        const url = `https://weatherapi.market.xiaomi.com/wtr-v3/weather/all?latitude=${lat}&longitude=${lon}&locationKey=weathercn:101040900&appKey=weather20151024&sign=ZJm8bN4vFQ6rFz5U&isGlobal=false`;
        fetch(url)
            .then(res => res.json())
            .then(data => {
                // 小米接口返回的污染数据路径：data.aqi.aqi
                if (data && data.aqi) {
                    callback(data.aqi);
                }
            })
            .catch(err => {
                console.error('获取污染指数失败', err);
            });
    }
    
    // 获取经纬度（可用浏览器定位或写死铜梁坐标）
    const tongliangLat = 29.8446;
    const tongliangLon = 106.0564;
    
    // 在updateWeatherForecast中调用
    function updateWeatherForecast(forecastData) {
        const weatherDays = document.querySelectorAll('.weather-day');
        
        // 检查是否有雨天预警
        checkRainForecast(forecastData);
        
        // 确保有天气预报数据
        if (forecastData.casts && forecastData.casts.length >= 3) {
            // 更新未来三天的天气预报
            for (let i = 0; i < Math.min(3, weatherDays.length); i++) {
                const dayData = forecastData.casts[i];
                const dayElement = weatherDays[i];
                
                // 更新日期名称（今天、明天、后天）
                const dayName = dayElement.querySelector('.day-name');
                if (i === 0) dayName.textContent = '今天';
                else if (i === 1) dayName.textContent = '明天';
                else if (i === 2) dayName.textContent = '后天';
                
                // 添加具体日期显示
                const dayDate = dayElement.querySelector('.day-date');
                if (dayDate) {
                    // 解析日期字符串 (格式: 2023-12-05)
                    const dateStr = dayData.date;
                    const dateParts = dateStr.split('-');
                    if (dateParts.length === 3) {
                        // 格式化为 MM/DD 格式
                        dayDate.textContent = `(${dateParts[1]}/${dateParts[2]})`;
                    } else {
                        dayDate.textContent = '';
                    }
                }
                
                // 更新天气图标和描述
                const weatherIcon = dayElement.querySelector('.weather-icon');
                const weatherDesc = dayElement.querySelector('.weather-desc');
                
                // 根据天气情况设置图标类
                weatherIcon.className = 'weather-icon';
                if (dayData.dayweather.includes('晴')) {
                    weatherIcon.classList.add('sunny');
                } else if (dayData.dayweather.includes('云') || dayData.dayweather.includes('阴')) {
                    weatherIcon.classList.add('cloudy');
                } else if (dayData.dayweather.includes('雨')) {
                    weatherIcon.classList.add('rainy');
                } else {
                    weatherIcon.classList.add('cloudy'); // 默认为多云
                }
                
                // 更新天气描述
                weatherDesc.textContent = dayData.dayweather;
                
                // 更新温度范围
                const temperature = dayElement.querySelector('.temperature');
                temperature.textContent = `${dayData.nighttemp}° / ${dayData.daytemp}°`;
            }
        }
    }
    
    // 根据实时天气数据更新提示语和实时温湿度
    function updateWeatherReminder(liveData) {
        const reminderElem = document.querySelector('.weather-reminder p');
        const temperature = parseInt(liveData.temperature);
        const weather = liveData.weather;
        const humidity = parseInt(liveData.humidity); // 获取湿度数据
        
        // 更新实时温度和湿度显示
        const realTempElem = document.getElementById('real-temp');
        const humidityElem = document.getElementById('humidity');
        
        if (realTempElem) {
            realTempElem.textContent = `${temperature}°C`;
        }
        
        if (humidityElem && humidity) {
            humidityElem.textContent = `${humidity}%`;
        }
        
        let reminder = '';
        
        // 根据温度和湿度给出更多样化的提示
        if (temperature < 0) {
            const tips = [
                '天气严寒，多穿几层衣服出门！',
                '冰天雪地，注意防滑保暖！',
                '温度低于零度，记得戴手套和帽子！'
            ];
            reminder += tips[Math.floor(Math.random() * tips.length)];
        } else if (temperature < 5) {
            const tips = [
                '天气阴冷，穿暖和点吧！',
                '温度很低，多穿点衣服！',
                '天气寒冷，注意保暖哦！'
            ];
            reminder += tips[Math.floor(Math.random() * tips.length)];
        } else if (temperature < 10) {
            const tips = [
                '天气微凉，注意保暖！',
                '早晚温差大，适当添加衣物！',
                '秋意渐浓，别忘了带件外套！'
            ];
            reminder += tips[Math.floor(Math.random() * tips.length)];
        } else if (temperature < 15) {
            const tips = [
                '温度适宜，很舒适的天气！',
                '天气凉爽宜人，适合户外活动！',
                '今天温度不冷不热，很舒服！'
            ];
            reminder += tips[Math.floor(Math.random() * tips.length)];
        } else if (temperature < 20) {
            const tips = [
                '天气舒适，适合出行！',
                '阳光正好，微风不燥，出门走走吧！',
                '今天温度宜人，是个好天气！'
            ];
            reminder += tips[Math.floor(Math.random() * tips.length)];
        } else if (temperature < 25) {
            const tips = [
                '天气温暖，适合短袖出门！',
                '阳光明媚，记得防晒哦！',
                '温度适中，是个好天气！'
            ];
            reminder += tips[Math.floor(Math.random() * tips.length)];
        } else if (temperature < 30) {
            const tips = [
                '天气有点热，注意防晒！',
                '温度较高，记得多喝水！',
                '阳光强烈，出门记得涂防晒霜！'
            ];
            reminder += tips[Math.floor(Math.random() * tips.length)];
        } else {
            const tips = [
                '天气炎热，注意防晒降温！',
                '高温天气，尽量避免午间外出！',
                '温度很高，记得补充水分防中暑！'
            ];
            reminder += tips[Math.floor(Math.random() * tips.length)];
        }
        
        // 根据湿度追加提示
        if (humidity > 80) {
            const tips = [
                ' 湿度较大，注意防潮！',
                ' 空气湿度高，衣物可能不易干！',
                ' 湿度大，感觉更闷热哦！'
            ];
            reminder += tips[Math.floor(Math.random() * tips.length)];
        } else if (humidity < 30) {
            const tips = [
                ' 空气干燥，记得多喝水！',
                ' 湿度低，注意保湿护肤！',
                ' 天气干燥，多补充水分！'
            ];
            reminder += tips[Math.floor(Math.random() * tips.length)];
        }
        
        // 根据天气状况追加提示
        if (weather.includes('雨')) {
            const tips = [
                ' 记得带伞！',
                ' 出门别忘了雨伞哦！',
                ' 雨天路滑，注意安全！',
                ' 雨水淅沥，记得穿防水鞋！'
            ];
            reminder += tips[Math.floor(Math.random() * tips.length)];
        } else if (weather.includes('雪')) {
            const tips = [
                ' 雪天路滑，注意防滑！',
                ' 下雪了，出门小心路滑！',
                ' 美丽的雪景，注意保暖！'
            ];
            reminder += tips[Math.floor(Math.random() * tips.length)];
        } else if (weather.includes('雾') || weather.includes('霾')) {
            const tips = [
                ' 空气质量不佳，建议戴口罩！',
                ' 能见度低，开车注意安全！',
                ' 雾霾天气，减少户外活动！'
            ];
            reminder += tips[Math.floor(Math.random() * tips.length)];
        } else if (weather.includes('晴')) {
            const tips = [
                ' 阳光明媚，心情也要晴朗！',
                ' 晴空万里，是个好天气！',
                ' 阳光正好，适合晒被子！'
            ];
            reminder += tips[Math.floor(Math.random() * tips.length)];
        } else if (weather.includes('阴')) {
            const tips = [
                ' 阴天容易使人感到疲倦，多活动活动！',
                ' 天色阴沉，记得开灯！',
                ' 阴天也有阴天的美，保持好心情！'
            ];
            reminder += tips[Math.floor(Math.random() * tips.length)];
        }
        
        reminderElem.textContent = reminder;
    }
    
    // 检查未来天气是否有雨并显示预警
    function checkRainForecast(forecastData) {
        const rainAlertElem = document.getElementById('rain-alert');
        if (!rainAlertElem) return;
        
        // 默认隐藏雨天预警
        rainAlertElem.style.display = 'none';
        
        // 检查未来三天是否有雨
        if (forecastData.casts && forecastData.casts.length > 0) {
            for (let i = 0; i < Math.min(3, forecastData.casts.length); i++) {
                const dayData = forecastData.casts[i];
                if (dayData.dayweather.includes('雨') || dayData.nightweather.includes('雨')) {
                    // 如果预测有雨，显示预警
                    rainAlertElem.style.display = 'block';
                    
                    // 更新预警信息，显示哪一天会下雨
                    let dayText = '';
                    if (i === 0) dayText = '今天';
                    else if (i === 1) dayText = '明天';
                    else if (i === 2) dayText = '后天';
                    
                    // 获取雨的类型
                    let rainType = '';
                    if (dayData.dayweather.includes('雨')) {
                        rainType = dayData.dayweather;
                    } else {
                        rainType = dayData.nightweather;
                    }
                    
                    // 根据雨的类型提供不同的预警信息
                    let alertMessage = '';
                    if (rainType.includes('大雨') || rainType.includes('暴雨')) {
                        const tips = [
                            `${dayText}将有${rainType}，出行请带好雨具，注意安全！`,
                            `预计${dayText}有${rainType}，尽量减少外出，注意防涝！`,
                            `气象预报：${dayText}${rainType}，请做好防雨准备，谨慎驾驶！`
                        ];
                        alertMessage = tips[Math.floor(Math.random() * tips.length)];
                    } else if (rainType.includes('中雨')) {
                        const tips = [
                            `${dayText}将有${rainType}，记得带伞出门！`,
                            `预计${dayText}有${rainType}，出行请携带雨具！`,
                            `${dayText}${rainType}，雨中漫步也是种享受，但别忘了伞！`
                        ];
                        alertMessage = tips[Math.floor(Math.random() * tips.length)];
                    } else {
                        const tips = [
                            `${dayText}可能有${rainType}，带把伞以防万一！`,
                            `预计${dayText}有${rainType}，雨量不大但要注意！`,
                            `${dayText}${rainType}，细雨蒙蒙，记得带伞哦！`
                        ];
                        alertMessage = tips[Math.floor(Math.random() * tips.length)];
                    }
                    
                    rainAlertElem.querySelector('p').textContent = alertMessage;
                    
                    // 找到第一个雨天就跳出循环
                    break;
                }
            }
        }
    }
    
    // 调用函数获取天气数据
    fetchWeatherData();
    
    // 每小时更新一次天气数据
    setInterval(fetchWeatherData, 3600000);
    
    // 以下是原有的图片处理代码，保留不变
    // 获取上传控件
    const imageUpload = document.getElementById('image-upload');
    // 获取所有图片元素
    const originalImg = document.getElementById('original-img');
    const effectImgs = document.querySelectorAll('.effect-img');
    
    // 获取Canvas元素
    const mosaicCanvas = document.getElementById('mosaic-canvas');
    const pixelateCanvas = document.getElementById('pixelate-canvas');
    const edgeCanvas = document.getElementById('edge-canvas');
    
    // 默认图片加载完成后应用Canvas效果
    if (originalImg) {
        originalImg.onload = function() {
            applyCanvasEffects(originalImg);
        };
    }
    
    // 监听文件上传事件
    if (imageUpload) {
        imageUpload.addEventListener('change', function(e) {
            const file = e.target.files[0];
            
            if (file) {
                // 检查文件类型
                if (!file.type.match('image.*')) {
                    alert('请上传图片文件！');
                    return;
                }
                
                // 创建FileReader读取文件
                const reader = new FileReader();
                
                reader.onload = function(e) {
                    // 设置原始图片和效果图片的src
                    originalImg.src = e.target.result;
                    
                    // 更新所有效果图片
                    effectImgs.forEach(img => {
                        img.src = e.target.result;
                    });
                    
                    // 应用Canvas效果
                    applyCanvasEffects(originalImg);
                };
                
                // 读取文件为DataURL
                reader.readAsDataURL(file);
            }
        });
    }
    
    // 应用Canvas效果的函数
    function applyCanvasEffects(sourceImg) {
        // 确保图片已加载
        if (!sourceImg.complete) {
            sourceImg.onload = function() {
                applyCanvasEffects(sourceImg);
            };
            return;
        }
        
        // 应用马赛克效果
        if (mosaicCanvas) {
            applyMosaicEffect(sourceImg, mosaicCanvas, 10);
        }
        
        // 应用像素化效果
        if (pixelateCanvas) {
            applyPixelateEffect(sourceImg, pixelateCanvas, 8);
        }
        
        // 应用边缘检测效果
        if (edgeCanvas) {
            applyEdgeDetectionEffect(sourceImg, edgeCanvas);
        }
    }
    
    // 马赛克效果
    function applyMosaicEffect(sourceImg, canvas, blockSize) {
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        
        // 清除画布
        ctx.clearRect(0, 0, width, height);
        
        // 绘制原始图像
        ctx.drawImage(sourceImg, 0, 0, width, height);
        
        // 获取图像数据
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;
        
        // 应用马赛克效果
        for (let y = 0; y < height; y += blockSize) {
            for (let x = 0; x < width; x += blockSize) {
                // 获取块的平均颜色
                let r = 0, g = 0, b = 0, count = 0;
                
                for (let by = 0; by < blockSize && y + by < height; by++) {
                    for (let bx = 0; bx < blockSize && x + bx < width; bx++) {
                        const idx = ((y + by) * width + (x + bx)) * 4;
                        r += data[idx];
                        g += data[idx + 1];
                        b += data[idx + 2];
                        count++;
                    }
                }
                
                // 计算平均值
                r = Math.floor(r / count);
                g = Math.floor(g / count);
                b = Math.floor(b / count);
                
                // 将块设置为平均颜色
                for (let by = 0; by < blockSize && y + by < height; by++) {
                    for (let bx = 0; bx < blockSize && x + bx < width; bx++) {
                        const idx = ((y + by) * width + (x + bx)) * 4;
                        data[idx] = r;
                        data[idx + 1] = g;
                        data[idx + 2] = b;
                    }
                }
            }
        }
        
        // 将处理后的图像数据放回画布
        ctx.putImageData(imageData, 0, 0);
    }
    
    // 像素化效果
    function applyPixelateEffect(sourceImg, canvas, pixelSize) {
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        
        // 清除画布
        ctx.clearRect(0, 0, width, height);
        
        // 设置图像平滑
        ctx.imageSmoothingEnabled = false;
        
        // 绘制小尺寸图像
        const smallWidth = Math.floor(width / pixelSize);
        const smallHeight = Math.floor(height / pixelSize);
        
        // 先绘制到小尺寸
        ctx.drawImage(sourceImg, 0, 0, smallWidth, smallHeight);
        
        // 再放大回原始尺寸
        ctx.drawImage(canvas, 0, 0, smallWidth, smallHeight, 0, 0, width, height);
    }
    
    // 边缘检测效果
    function applyEdgeDetectionEffect(sourceImg, canvas) {
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        
        // 清除画布
        ctx.clearRect(0, 0, width, height);
        
        // 绘制原始图像
        ctx.drawImage(sourceImg, 0, 0, width, height);
        
        // 获取图像数据
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;
        const dataClone = new Uint8ClampedArray(data);
        
        // Sobel算子
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                // 当前像素索引
                const idx = (y * width + x) * 4;
                
                // 计算周围像素的灰度值
                const tl = getGrayscale(dataClone, ((y - 1) * width + (x - 1)) * 4);
                const t = getGrayscale(dataClone, ((y - 1) * width + x) * 4);
                const tr = getGrayscale(dataClone, ((y - 1) * width + (x + 1)) * 4);
                const l = getGrayscale(dataClone, (y * width + (x - 1)) * 4);
                const r = getGrayscale(dataClone, (y * width + (x + 1)) * 4);
                const bl = getGrayscale(dataClone, ((y + 1) * width + (x - 1)) * 4);
                const b = getGrayscale(dataClone, ((y + 1) * width + x) * 4);
                const br = getGrayscale(dataClone, ((y + 1) * width + (x + 1)) * 4);
                
                // 水平和垂直梯度
                const gx = -tl - 2 * l - bl + tr + 2 * r + br;
                const gy = -tl - 2 * t - tr + bl + 2 * b + br;
                
                // 梯度幅值
                const g = Math.sqrt(gx * gx + gy * gy);
                
                // 设置边缘像素
                const edgeValue = g > 50 ? 255 : 0;
                data[idx] = edgeValue;
                data[idx + 1] = edgeValue;
                data[idx + 2] = edgeValue;
            }
        }
        
        // 将处理后的图像数据放回画布
        ctx.putImageData(imageData, 0, 0);
    }
    
    // 获取像素的灰度值
    function getGrayscale(data, idx) {
        return (data[idx] * 0.3 + data[idx + 1] * 0.59 + data[idx + 2] * 0.11);
    }
});