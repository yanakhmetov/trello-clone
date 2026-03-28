// prisma/seed.ts
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')
  
  try {
    // Проверяем подключение
    await prisma.$connect()
    console.log('✅ Connected to database')
    
    // Очищаем все таблицы в правильном порядке (из-за связей)
    console.log('🗑️  Cleaning existing data...')
    await prisma.subtask.deleteMany({})
    await prisma.task.deleteMany({})
    await prisma.column.deleteMany({})
    await prisma.board.deleteMany({})
    await prisma.user.deleteMany({})
    console.log('✅ Cleaned existing data')
    
    const hashedPassword = await bcrypt.hash('password123', 10)
    
    // Создаем тестового пользователя
    console.log('👤 Creating test user...')
    const user = await prisma.user.create({
      data: {
        email: 'user@example.com',
        name: 'Test User',
        password: hashedPassword,
      }
    })
    
    console.log(`✅ Created user: ${user.email} (ID: ${user.id})`)
    
    // Создаем первую доску с колонками и задачами
    console.log('📋 Creating board: "Мой первый проект"...')
    const board1 = await prisma.board.create({
      data: {
        title: 'Мой первый проект',
        description: 'Учебный проект для изучения Trello Clone',
        userId: user.id,
      }
    })
    
    // Создаем колонки для первой доски (на русском)
    const todoColumn = await prisma.column.create({
      data: {
        title: '📝 Нужно сделать',
        order: 0,
        boardId: board1.id,
      }
    })
    
    const inProgressColumn = await prisma.column.create({
      data: {
        title: '🔄 В процессе',
        order: 1,
        boardId: board1.id,
      }
    })
    
    const doneColumn = await prisma.column.create({
      data: {
        title: '✅ Готово',
        order: 2,
        boardId: board1.id,
      }
    })
    
    console.log('✅ Created 3 columns for board 1')
    
    // Создаем задачи для колонки Нужно сделать
    console.log('📝 Creating tasks...')
    
    const task1 = await prisma.task.create({
      data: {
        title: 'Изучить Next.js 16',
        description: 'Понять новые фичи App Router, Server Components и Turbopack',
        order: 0,
        columnId: todoColumn.id,
      }
    })
    
    await prisma.subtask.createMany({
      data: [
        { title: 'Прочитать документацию Next.js 16', isDone: true, taskId: task1.id },
        { title: 'Разобраться с App Router', isDone: true, taskId: task1.id },
        { title: 'Сделать пример приложения', isDone: false, taskId: task1.id },
        { title: 'Написать тесты', isDone: false, taskId: task1.id },
      ]
    })
    
    const task2 = await prisma.task.create({
      data: {
        title: 'Настроить Prisma 6',
        description: 'Подключить PostgreSQL, настроить ORM и создать схемы',
        order: 1,
        columnId: todoColumn.id,
      }
    })
    
    await prisma.subtask.createMany({
      data: [
        { title: 'Установить Prisma', isDone: true, taskId: task2.id },
        { title: 'Настроить схему базы данных', isDone: true, taskId: task2.id },
        { title: 'Создать миграции', isDone: true, taskId: task2.id },
        { title: 'Настроить seed', isDone: false, taskId: task2.id },
      ]
    })
    
    const task3 = await prisma.task.create({
      data: {
        title: 'Реализовать Drag & Drop',
        description: 'Добавить возможность перемещать задачи между колонками',
        order: 2,
        columnId: todoColumn.id,
      }
    })
    
    await prisma.subtask.createMany({
      data: [
        { title: 'Установить @dnd-kit', isDone: true, taskId: task3.id },
        { title: 'Настроить DndContext', isDone: true, taskId: task3.id },
        { title: 'Реализовать перетаскивание задач', isDone: false, taskId: task3.id },
        { title: 'Добавить перетаскивание колонок', isDone: false, taskId: task3.id },
      ]
    })
    
    // Создаем задачу для колонки В процессе
    const task4 = await prisma.task.create({
      data: {
        title: 'Создать компонент Board',
        description: 'Основная доска с колонками и Drag & Drop',
        order: 0,
        columnId: inProgressColumn.id,
      }
    })
    
    await prisma.subtask.createMany({
      data: [
        { title: 'Создать BoardClient компонент', isDone: true, taskId: task4.id },
        { title: 'Добавить колонки', isDone: true, taskId: task4.id },
        { title: 'Реализовать отображение задач', isDone: true, taskId: task4.id },
        { title: 'Добавить Drag & Drop', isDone: false, taskId: task4.id },
      ]
    })
    
    // Создаем задачу для колонки Готово
    const task5 = await prisma.task.create({
      data: {
        title: 'Настроить аутентификацию',
        description: 'Добавить регистрацию и вход пользователей',
        order: 0,
        columnId: doneColumn.id,
      }
    })
    
    await prisma.subtask.createMany({
      data: [
        { title: 'Установить NextAuth.js', isDone: true, taskId: task5.id },
        { title: 'Настроить провайдеры', isDone: true, taskId: task5.id },
        { title: 'Создать страницы логина', isDone: true, taskId: task5.id },
        { title: 'Добавить защиту маршрутов', isDone: true, taskId: task5.id },
      ]
    })
    
    // Создаем вторую доску
    console.log('📋 Creating board: "Личные задачи"...')
    const board2 = await prisma.board.create({
      data: {
        title: 'Личные задачи',
        description: 'Что нужно сделать в ближайшее время',
        userId: user.id,
      }
    })
    
    const personalTodo = await prisma.column.create({
      data: {
        title: '📋 Запланировано',
        order: 0,
        boardId: board2.id,
      }
    })
    
    const personalProgress = await prisma.column.create({
      data: {
        title: '🏃‍♂️ В процессе',
        order: 1,
        boardId: board2.id,
      }
    })
    
    const personalDone = await prisma.column.create({
      data: {
        title: '🎉 Выполнено',
        order: 2,
        boardId: board2.id,
      }
    })
    
    console.log('✅ Created 3 columns for board 2')
    
    // Создаем задачи для личной доски
    await prisma.task.createMany({
      data: [
        { 
          title: 'Купить продукты', 
          description: 'Молоко, хлеб, яйца, овощи, фрукты', 
          order: 0, 
          columnId: personalTodo.id 
        },
        { 
          title: 'Сходить в спортзал', 
          description: '3 раза в неделю: понедельник, среда, пятница', 
          order: 1, 
          columnId: personalTodo.id 
        },
        { 
          title: 'Записаться к врачу', 
          description: 'Плановый осмотр', 
          order: 2, 
          columnId: personalTodo.id 
        },
        { 
          title: 'Прочитать книгу', 
          description: '"Чистый код" Роберта Мартина - главы 1-5', 
          order: 0, 
          columnId: personalProgress.id 
        },
        { 
          title: 'Выучить английский', 
          description: 'Уроки на Duolingo - 15 минут в день', 
          order: 1, 
          columnId: personalProgress.id 
        },
        { 
          title: 'Настроить окружение', 
          description: 'Node.js, Git, VS Code, расширения', 
          order: 0, 
          columnId: personalDone.id 
        },
        { 
          title: 'Создать репозиторий на GitHub', 
          description: 'Инициализировать проект и сделать первый коммит', 
          order: 1, 
          columnId: personalDone.id 
        },
      ]
    })
    
    console.log('✅ Created tasks for board 2')
    
    // Создаем третью доску для демонстрации
    console.log('📋 Creating board: "Идеи для проекта"...')
    const board3 = await prisma.board.create({
      data: {
        title: '💡 Идеи для проекта',
        description: 'Что можно добавить в Trello Clone',
        userId: user.id,
      }
    })
    
    const ideasColumn = await prisma.column.create({
      data: {
        title: '✨ Идеи',
        order: 0,
        boardId: board3.id,
      }
    })
    
    const inDevColumn = await prisma.column.create({
      data: {
        title: '🔨 В разработке',
        order: 1,
        boardId: board3.id,
      }
    })
    
    const completedColumn = await prisma.column.create({
      data: {
        title: '🎯 Реализовано',
        order: 2,
        boardId: board3.id,
      }
    })
    
    await prisma.task.createMany({
      data: [
        { 
          title: 'Добавить поиск по задачам', 
          description: 'Глобальный поиск по всем доскам', 
          order: 0, 
          columnId: ideasColumn.id 
        },
        { 
          title: 'Добавить метки и теги', 
          description: 'Цветные метки для приоритетов и категорий', 
          order: 1, 
          columnId: ideasColumn.id 
        },
        { 
          title: 'Добавить дедлайны', 
          description: 'Возможность устанавливать сроки выполнения', 
          order: 2, 
          columnId: ideasColumn.id 
        },
        { 
          title: 'Добавить комментарии к задачам', 
          description: 'Обсуждение задач внутри карточки', 
          order: 3, 
          columnId: ideasColumn.id 
        },
        { 
          title: 'Drag & Drop колонок', 
          description: 'Возможность менять порядок колонок', 
          order: 0, 
          columnId: completedColumn.id 
        },
        { 
          title: 'Подзадачи с чекбоксами', 
          description: 'Разбивка задач на подзадачи', 
          order: 1, 
          columnId: completedColumn.id 
        },
      ]
    })
    
    console.log('✅ Created board 3 with ideas')
    
    console.log('✨ Seeding completed successfully!')
    console.log('')
    console.log('📊 Statistics:')
    console.log(`   - 1 user created`)
    console.log(`   - 3 boards created`)
    console.log(`   - 9 columns created`)
    console.log(`   - ${await prisma.task.count()} tasks created`)
    console.log(`   - ${await prisma.subtask.count()} subtasks created`)
    console.log('')
    console.log('📋 Test credentials:')
    console.log('   Email: user@example.com')
    console.log('   Password: password123')
    console.log('')
    console.log('📁 Available boards:')
    console.log('   1. Мой первый проект (учебный)')
    console.log('   2. Личные задачи')
    console.log('   3. Идеи для проекта')
    
  } catch (error) {
    console.error('❌ Error during seeding:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })