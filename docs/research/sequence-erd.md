Теперь понял: у тебя **exchange-сервис**, где пользователь заполняет форму заявки (например, обмен USDT → UAH), вводит e-mail, и **на этом же шаге ты либо создаёшь новый профиль, либо подтягиваешь существующий**. При этом нет жёсткой авторизации и нет «ограниченного профиля» — сессия нужна больше как:

- связывание пользователя с его заявкой,
- минимальная защита от спама (один e-mail = один «юзер»),
- удобство (юзер не тратит время на логин/регистрацию).

Тогда давай я дам **2 вещи**:

1. **Диаграмму последовательности (sequence)** — шаги, как работает этот flow.
2. **ERD (сущности users/sessions/orders)** — упрощённую, под твой кейс.

---

## 1. Sequence diagram (flow «создание заявки с авто-профилем и сессией»)

```mermaid
sequenceDiagram
    participant User
    participant Browser
    participant Backend
    participant DB

    User->>Browser: Открывает форму заявки
    User->>Browser: Заполняет поля (сумма, валюта, email)
    Browser->>Backend: POST /orders {email, amount, ...}

    Backend->>DB: SELECT user_id FROM users WHERE email=?
    alt user exists
        DB-->>Backend: user_id найден
    else user not exists
        Backend->>DB: INSERT INTO users (email, created_at)
        DB-->>Backend: user_id создан
    end

    Backend->>Backend: Генерация session_id
    Backend->>DB: INSERT INTO sessions {session_id, user_id, expires_at}
    Backend-->>Browser: Устанавливает cookie session_id

    Backend->>DB: INSERT INTO orders {user_id, amount, ...}
    Backend-->>Browser: 200 OK (order_id, статус)

    Browser-->>User: Показывает страницу «Заявка создана»

```

---

## 2. ERD (users, sessions, orders)

```mermaid
erDiagram
    USERS {
        int id PK
        string email
        datetime created_at
    }

    SESSIONS {
        string id PK
        int user_id FK
        datetime created_at
        datetime expires_at
        string ip
        string user_agent
    }

    ORDERS {
        int id PK
        int user_id FK
        string from_currency
        string to_currency
        float amount
        string status
        datetime created_at
    }

    USERS ||--o{ ORDERS : places
    USERS ||--o{ SESSIONS : has

```

---

## Ключевые особенности твоего сценария

- **Регистрация без фрикции**: email = «ключ». Если пользователь впервые оставил email → создаётся user, сессия, и сразу можно создать заявку.
- **Сессия нужна не для security**, а для:
  - связывания пользователя с несколькими заявками,
  - авто-подтягивания email в форме при повторном визите,
  - минимальной защиты от спама (роботам придётся генерировать уникальные почты).

- **Без ограничений**: пользователь сразу получает полный доступ к функционалу (создание заявки). Нет отдельного шага подтверждения.
- **Минимальные защиты**: капча/Rate-limit на POST /orders + уникальность e-mail для уменьшения спама.

---
