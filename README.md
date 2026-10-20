# Cyber Safety Buddy

Проектът съдържа статичния сайт и три Azure Functions API адреса. Структурата е подготвена за Azure Static Web Apps.

## API адреси

- `POST /api/checkEmailLeak` — проверява дали имейлът се среща в публични източници на течове чрез LeakCheck. Кодът не пази суровия имейл; при включено Azure Table Storage се записват само SHA-256 хеш и обобщение.
- `POST /api/checkLink` — проверява подозрителни признаци в линк и използва VirusTotal, ако е зададен ключ.
- `POST /api/trackEvent` — записва анонимни събития в логовете на Azure Function.

Проверката на силата на паролата се изпълнява локално в браузъра. Паролата не се изпраща към API.

## Публикуване в Azure Static Web Apps

Съществуващият GitHub Actions workflow публикува проекта автоматично при промяна в `main`. Конфигурацията е: App location `/`, API location `api`, Output location празно. `staticwebapp.config.json` задава Node.js 22 за API-то.

Сайтът и API-тата трябва да са в една Static Web App, защото браузърът ги вика през относителни адреси `/api/...`.

## Незадължителни настройки в Azure

- `VIRUSTOTAL_API_KEY` — включва справки във VirusTotal. Без него локалната проверка на линкове продължава да работи.
- `SCAN_STORAGE_CONNECTION_STRING` — включва съхраняването на обобщения в Azure Table Storage. Без него проверката за течове продължава да работи и връща `stored: false`.

Добави ключовете в Application settings на Static Web App. Не ги слагай в JavaScript файловете или в GitHub кода.

LeakCheck е външна услуга и наличността му зависи от техния API. Функциите са публични HTTP endpoints, както очаква сегашният сайт.
