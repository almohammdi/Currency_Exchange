    // ---------- أسعار الصرف الثابتة (مرجعية) ----------
    // جميع العملات مقومة مقابل الدولار الأمريكي كقاعدة.
    // السعر: 1 دولار = 3.79 ريال سعودي ، 1 دولار = 420 ريال يمني
    const EXCHANGE_RATES = {
        USD: 1.0,          // الدولار الأمريكي
        SAR: 3.79,         // الريال السعودي لكل دولار
        YER: 420.0        // الريال اليمني لكل دولار
    };

    // دالة مساعدة: تحويل أي مبلغ من عملة إلى دولار أمريكي أولاً (قاعدة)
    function convertToUSD(amount, fromCurrency) {
        if (fromCurrency === 'USD') {
            return amount;
        } else if (fromCurrency === 'SAR') {
            // المبلغ بالريال السعودي -> نحتاج إلى كم يساوي بالدولار
            // بما أن 1 USD = 3.79 SAR -> 1 SAR = 1 / 3.79 USD
            return amount / EXCHANGE_RATES.SAR;
        } else if (fromCurrency === 'YER') {
            // 1 USD = 420 YER -> 1 YER = 1/420 USD
            return amount / EXCHANGE_RATES.YER;
        }
        return 0;
    }

    // تحويل من مبلغ بالدولار إلى العملة المستهدفة
    function convertFromUSD(usdAmount, targetCurrency) {
        if (targetCurrency === 'USD') {
            return usdAmount;
        } else if (targetCurrency === 'SAR') {
            return usdAmount * EXCHANGE_RATES.SAR;
        } else if (targetCurrency === 'YER') {
            return usdAmount * EXCHANGE_RATES.YER;
        }
        return 0;
    }

    // تنسيق رقمي لطيف: يظهر كحد أقصى 4 منازل عشرية إذا كانت عشرية، وإلا بدون كسور
    function formatMoney(value, currencyCode) {
        if (isNaN(value) || value === null || value === undefined) return '0';
        // تحديد عدد الخانات العشرية حسب العملة (للريال اليمني قد يكون كبير لكن نضبط 2 أو 4)
        let decimals = 2;
        if (currencyCode === 'YER') {
            // الريال اليمني أحياناً يحتاج دقة أكثر لكن نكتفي بـ 2 أو حسب المنطق
            decimals = 2;
        } else if (currencyCode === 'SAR') {
            decimals = 2;
        } else {
            decimals = 2;
        }
        // إذا كان الرقم صحيحاً تماماً نزيل الفاصلة العشرية غير الضرورية
        let formatted = value.toFixed(decimals);
        // إزالة الأصفار الزائدة عن الحاجة للنقاط العشرية (لكن نترك رقمين كحد أقصى)
        if (formatted.includes('.')) {
            formatted = formatted.replace(/\.?0+$/, '');
            if (formatted.endsWith('.')) formatted = formatted.slice(0, -1);
        }
        // إضافة فاصلة الآلاف كل 3 أرقام
        let parts = formatted.split('.');
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        return parts.join('.');
    }

    // الحصول على اسم العملة كاملاً وعلمها (رمز)
    function getCurrencyFullName(code) {
        switch(code) {
            case 'USD': return '🇺🇸 دولار أمريكي';
            case 'SAR': return '🇸🇦 ريال سعودي';
            case 'YER': return '🇾🇪 ريال يمني';
            default: return code;
        }
    }

    // الحصول على رمز العملة المختصر + رمز
    function getCurrencySymbol(code) {
        switch(code) {
            case 'USD': return '$';
            case 'SAR': return '﷼';
            case 'YER': return 'ر.ي';
            default: return '';
        }
    }

    // الوظيفة الرئيسية التي تقوم بعملية المصارفة وعرض النتائج بالعملات الأخرى
    function performExchange() {
        // مسح أي خطأ سابق
        const errorContainer = document.getElementById('errorContainer');
        errorContainer.innerHTML = '';
        
        // الحصول على المبلغ والعملة الأساسية
        let amountInput = document.getElementById('amountInput').value.trim();
        const baseCurrency = document.getElementById('baseCurrency').value;
        
        // التحقق من صحة المبلغ
        if (amountInput === "") {
            showError("⚠️ يرجى إدخال مبلغ صحيح (رقم)");
            return;
        }
        
        // تحويل الفاصلة إن وجدت (يدعم '.' و ',' لكننا نستبدل ',' ب '.')
        let normalizedAmount = amountInput.replace(/,/g, '.');
        let amountNumber = parseFloat(normalizedAmount);
        
        if (isNaN(amountNumber)) {
            showError("❌ القيمة المدخلة ليست رقماً صالحاً. تأكد من إدخال رقم.");
            return;
        }
        
        if (amountNumber < 0) {
            showError("⚠️ لا يمكن إدخال مبلغ سالب. الرجاء إدخال مبلغ موجب.");
            return;
        }
        
        // السماح بقيم صفرية (عرض 0)
        // تحويل المبلغ الأساسي إلى الدولار الأمريكي أولاً
        let amountInUSD = convertToUSD(amountNumber, baseCurrency);
        
        // قائمة العملات المستهدفة (العملات الأخرى باستثناء العملة الأساسية)
        const allCurrencies = ['USD', 'SAR', 'YER'];
        const targetCurrencies = allCurrencies.filter(cur => cur !== baseCurrency);
        
        // تخزين النتائج لكل عملة مستهدفة
        const results = [];
        
        for (let target of targetCurrencies) {
            let convertedValue = convertFromUSD(amountInUSD, target);
            // نستخدم fixed دقة 4 لحساب القيمة ثم تنسيقها
            results.push({
                currency: target,
                value: convertedValue
            });
        }
        
        // بالإضافة إلى ذلك، ربما نريد إظهار العملة الأساسية أيضاً؟ لكن المطلوب "عرض النتائج بالعملات الأخرى"
        // المطلوب: يظهر في الأسفل "نتائج المصارفة" بالعملات الأخرى. لذا نعرض فقط العملات المغايرة.
        // لكن يمكن إضافة عملة الأساس كمرجع، لكن الأفضل الالتزام بالطلب: عرض النتائج بالعملات الأخرى.
        
        // بناء واجهة النتائج
        const resultsListDiv = document.getElementById('resultsList');
        
        if (results.length === 0) {
            // هذا لن يحدث أبداً لأنه لدينا على الأقل عملتان أخريان
            resultsListDiv.innerHTML = '<div style="text-align:center; padding:1rem;">⚠️ لا توجد عملات أخرى لعرضها</div>';
            return;
        }
        
        // تنظيف div النتائج
        resultsListDiv.innerHTML = '';
        
        // إضافة بطاقة معلومات المبلغ المُدخل (اختياري لتوضيح السياق)
        const inputContext = document.createElement('div');
        inputContext.style.cssText = 'background:#eef3fa; border-radius:1.2rem; padding:0.7rem 1rem; margin-bottom:1rem; font-size:0.9rem; display:flex; justify-content:space-between; flex-wrap:wrap;';
        const formattedInputAmount = formatMoney(amountNumber, baseCurrency);
        const baseCurrencyName = getCurrencyFullName(baseCurrency);
        inputContext.innerHTML = `
            <span>📌 المبلغ المُدخل: </span>
            <strong style="color:#1f5e3a;">${formattedInputAmount} ${getCurrencySymbol(baseCurrency)} (${baseCurrencyName})</strong>
        `;
        resultsListDiv.appendChild(inputContext);
        
        // إنشاء قائمة بالنتائج للعملات الأخرى
        for (let res of results) {
            const row = document.createElement('div');
            row.className = 'currency-result';
            
            const currencyFull = getCurrencyFullName(res.currency);
            const symbol = getCurrencySymbol(res.currency);
            const formattedValue = formatMoney(res.value, res.currency);
            
            row.innerHTML = `
                <div class="currency-name">
                    <span>${currencyFull}</span>
                </div>
                <div class="currency-amount">
                    ${formattedValue} ${symbol}
                </div>
            `;
            resultsListDiv.appendChild(row);
        }
        
        // إضافة سطر توضيحي صغير بأسعار الصرف المستخدمة (اختياري)
        const noteDiv = document.createElement('div');
        noteDiv.style.cssText = 'margin-top: 12px; font-size: 0.7rem; color: #5f7e97; text-align: center; border-top: 1px solid #dce5ec; padding-top: 10px;';
        noteDiv.innerHTML = `⚡ السعر المعتمد: 1 دولار = 3.79 ريال سعودي = 420 ريال يمني`;
        resultsListDiv.appendChild(noteDiv);
        
        // إضافة تأثير تمرير لطيف
        document.getElementById('resultPanel').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    
    // وظيفة عرض الأخطاء بطريقة جميلة
    function showError(message) {
        const errorContainer = document.getElementById('errorContainer');
        errorContainer.innerHTML = `
            <div class="error-message">
                <span>⚠️</span> ${message}
            </div>
        `;
        // أيضًا نمسح النتائج السابقة أو نضعها في حالة خطأ؟
        const resultsListDiv = document.getElementById('resultsList');
        resultsListDiv.innerHTML = `<div style="text-align: center; padding: 1.5rem; color: #aa6f6a;">❗ لا يمكن عرض النتائج بسبب خطأ في الإدخال</div>`;
        // مسح السياق السابق
    }
    
    // عند تحميل الصفحة بالكامل وربط الأحداث
    document.addEventListener('DOMContentLoaded', () => {
        const exchangeButton = document.getElementById('exchangeBtn');
        // ربط حدث النقر على زر المصارفة
        exchangeButton.addEventListener('click', performExchange);
        
        // إضافة خاصية: عند الضغط على مفتاح Enter في حقل المبلغ يتم تنفيذ المصارفة أيضاً
        const amountField = document.getElementById('amountInput');
        amountField.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                performExchange();
            }
        });
        
        // أيضاً إذا غير القائمة المنسدلة، يمكن تركها بدون تنفيذ تلقائي، لكن من المستحسن أن يتم التنفيذ يدوياً، لكن القوائم ليس لها حدث تلقائي احتراماً لتجربة المستخدم.
        // لكن يمكن إضافة ميزة: عرض النتائج أول مرة بشكل افتراضي بقيم أولية جميلة (عند تحميل الصفحة)
        // تنفيذ مصارفة أولية للترحيب
        setTimeout(() => {
            // تعيين قيمة المثال 100 دولار بشكل افتراضي إذا كان الحقل فارغاً أو شيء
            if (document.getElementById('amountInput').value === "") {
                document.getElementById('amountInput').value = "100";
            }
            performExchange();
        }, 100);
    });
    
    // احتراز إضافي: معالجة الإدخال العشري عبر ضمان النقطة
    const amountInputElem = document.getElementById('amountInput');
    if (amountInputElem) {
        amountInputElem.addEventListener('input', function(e) {
            // السماح بنقطة عشرية واحدة فقط واستبدال الفواصل
            let val = e.target.value;
            if (val.includes(',')) {
                val = val.replace(/,/g, '.');
                e.target.value = val;
            }
        });
    }
