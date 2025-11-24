document.addEventListener('DOMContentLoaded', function() {
    const forms = document.querySelectorAll('.tool-form');
    const statusMessage = document.getElementById('status-message');
    const timerElement = document.getElementById('cooldown-timer');
    const COOLDOWN_KEY = 'taiphan_cooldown'; 

    function showStatus(message, type = 'success') {
        statusMessage.textContent = message;
        statusMessage.className = `message ${type}`; 
        statusMessage.classList.remove('hidden');
        setTimeout(() => {
            statusMessage.classList.add('hidden');
        }, 5000); 
    }

    function updateTimer() {
        const storedEndTime = localStorage.getItem(COOLDOWN_KEY);
        let cooldownDuration = 0;

        if (storedEndTime) {
            cooldownDuration = Math.max(0, Math.floor((storedEndTime - Date.now()) / 1000));
        }

        const minutes = Math.floor(cooldownDuration / 60);
        const seconds = cooldownDuration % 60;
        
        if (cooldownDuration > 0) {
            timerElement.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
            
            forms.forEach(form => {
                form.querySelector('button').disabled = true;
                form.querySelector('button').textContent = `Chờ (${minutes}:${String(seconds).padStart(2, '0')})`;
            });
            
            setTimeout(updateTimer, 1000);
        } else {
            forms.forEach(form => {
                form.querySelector('button').disabled = false;
                form.querySelector('button').textContent = `Sử Dụng`;
            });
            timerElement.textContent = `Sẵn Sàng`;
            localStorage.removeItem(COOLDOWN_KEY);
        }
    }

    updateTimer(); 

    forms.forEach(form => {
        form.addEventListener('submit', async function(event) {
            event.preventDefault();

            const inputField = form.querySelector('input[type="text"]');
            const url = inputField.value.trim();
            const toolType = form.dataset.tool;
            const button = form.querySelector('button');
            const originalButtonText = button.textContent;

            if (!url) {
                showStatus('Vui lòng nhập ID hoặc URL.', 'error');
                return;
            }
            
            button.disabled = true;
            button.textContent = 'Đang Gửi...';

            try {
                const response = await fetch('/api/submit-tool', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url, toolType })
                });

                const data = await response.json();

                if (response.ok) {
                    showStatus(data.message || 'Yêu cầu đang được xử lý!', 'success');
                    
                    const newCooldownEndTime = Date.now() + 1800 * 1000; // 30 phút (Nếu Backend không trả về cooldown)
                    if (data.cooldown) {
                         newCooldownEndTime = Date.now() + data.cooldown * 1000;
                    }

                    localStorage.setItem(COOLDOWN_KEY, newCooldownEndTime);
                    updateTimer(); 
                    
                    inputField.value = ''; 
                } else {
                    showStatus(data.error || 'Đã xảy ra lỗi!', 'error');
                    button.disabled = false;
                    button.textContent = originalButtonText;
                }
            } catch (error) {
                showStatus('Không thể kết nối đến máy chủ. Vui lòng thử lại.', 'error');
                button.disabled = false;
                button.textContent = originalButtonText;
            }
        });
    });
});