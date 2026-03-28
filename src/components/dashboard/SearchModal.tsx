// src/components/dashboard/SearchModal.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X, FileText, CheckSquare, Loader2, ChevronRight, CheckCircle } from 'lucide-react'

interface SearchItem {
  type: 'task' | 'subtask'
  id: string
  title: string
  description: string | null
  updatedAt: Date
  board: {
    id: string
    title: string
  }
  columnTitle: string
  taskTitle?: string
  taskId?: string
  isDone?: boolean
  subtasksCount: number
  completedSubtasks: number
}

interface SearchResult {
  board: {
    id: string
    title: string
  }
  items: SearchItem[]
}

interface SearchModalProps {
  isOpen: boolean
  onClose: () => void
  onTaskClick?: (taskId: string, boardId: string) => void
}

export function SearchModal({ isOpen, onClose, onTaskClick }: SearchModalProps) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)
  const resultsRef = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  // Закрытие при клике вне модалки
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  // Закрытие при нажатии Escape
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
    }
    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  useEffect(() => {
    const searchTasks = async () => {
      if (query.trim().length < 2) {
        setResults([])
        return
      }

      setLoading(true)
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
        const data = await response.json()
        setResults(data.results)
      } catch (error) {
        console.error('Error searching:', error)
      } finally {
        setLoading(false)
      }
    }

    const debounce = setTimeout(searchTasks, 300)
    return () => clearTimeout(debounce)
  }, [query])

  const handleItemClick = (item: SearchItem) => {
    const taskId = item.type === 'task' ? item.id : item.taskId
    if (taskId && onTaskClick) {
      onTaskClick(taskId, item.board.id)
    } else if (taskId) {
      router.push(`/board/${item.board.id}?task=${taskId}`)
    }
    onClose()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const allItems = results.flatMap(r => r.items)
    
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => Math.min(prev + 1, allItems.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => Math.max(prev - 1, -1))
    } else if (e.key === 'Enter' && selectedIndex >= 0 && allItems[selectedIndex]) {
      handleItemClick(allItems[selectedIndex])
    }
  }

  useEffect(() => {
    if (selectedIndex >= 0 && resultsRef.current[selectedIndex]) {
      resultsRef.current[selectedIndex]?.scrollIntoView({
        block: 'nearest',
      })
    }
  }, [selectedIndex])

  if (!isOpen) return null

  const allItems = results.flatMap(r => r.items)
  const totalCount = allItems.length

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 pt-20">
      <div
        ref={modalRef}
        className="w-full max-w-2xl bg-white dark:bg-gray-900 rounded-xl shadow-2xl overflow-hidden"
      >
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setSelectedIndex(-1)
            }}
            onKeyDown={handleKeyDown}
            placeholder="Поиск по задачам и подзадачам..."
            className="flex-1 outline-none text-lg bg-transparent text-gray-900 dark:text-white placeholder:text-gray-400"
          />
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
            </div>
          )}

          {!loading && query.trim().length >= 2 && results.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
              <p>Ничего не найдено</p>
              <p className="text-sm mt-1">Попробуйте другой поисковый запрос</p>
            </div>
          )}

          {!loading && query.trim().length < 2 && (
            <div className="text-center py-12 text-gray-400">
              <Search className="w-12 h-12 mx-auto mb-3" />
              <p>Введите минимум 2 символа для поиска</p>
            </div>
          )}

          {results.map((result, boardIndex) => (
            <div key={result.board.id} className="border-b border-gray-200 dark:border-gray-700 last:border-b-0">
              <div className="sticky top-0 bg-gray-50 dark:bg-gray-800 px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-gray-700 dark:text-gray-300">{result.board.title}</h3>
              </div>
              <div>
                {result.items.map((item, itemIndex) => {
                  const globalIndex = results
                    .slice(0, boardIndex)
                    .reduce((acc, r) => acc + r.items.length, 0) + itemIndex
                  
                  const isSelected = globalIndex === selectedIndex
                  
                  if (item.type === 'task') {
                    return (
                      <div
                        key={item.id}
                        ref={(el) => {
                          resultsRef.current[globalIndex] = el
                        }}
                        className={`px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition ${
                          isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                        }`}
                        onClick={() => handleItemClick(item)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5">
                            <FileText className="w-4 h-4 text-blue-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1 text-xs text-gray-400 mb-1">
                              <span>{item.board.title}</span>
                              <ChevronRight className="w-3 h-3" />
                              <span>{item.columnTitle}</span>
                            </div>
                            <p className="font-medium text-gray-800 dark:text-white">{item.title}</p>
                            {item.description && (
                              <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5">
                                {item.description}
                              </p>
                            )}
                            {item.subtasksCount > 0 && (
                              <div className="flex items-center gap-1 mt-2 text-xs text-gray-400">
                                <CheckSquare className="w-3 h-3" />
                                <span>
                                  {item.completedSubtasks}/{item.subtasksCount} подзадач
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  } else {
                    return (
                      <div
                        key={item.id}
                        ref={(el) => {
                          resultsRef.current[globalIndex] = el
                        }}
                        className={`px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition ${
                          isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                        }`}
                        onClick={() => handleItemClick(item)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5">
                            {item.isDone ? (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            ) : (
                              <CheckSquare className="w-4 h-4 text-gray-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1 text-xs text-gray-400 mb-1">
                              <span>{item.board.title}</span>
                              <ChevronRight className="w-3 h-3" />
                              <span>{item.columnTitle}</span>
                              <ChevronRight className="w-3 h-3" />
                              <span>{item.taskTitle}</span>
                            </div>
                            <p className={`font-medium ${item.isDone ? 'line-through text-gray-400' : 'text-gray-800 dark:text-white'}`}>
                              {item.title}
                            </p>
                            {item.subtasksCount > 0 && (
                              <div className="flex items-center gap-1 mt-2 text-xs text-gray-400">
                                <CheckSquare className="w-3 h-3" />
                                <span>
                                  {item.completedSubtasks}/{item.subtasksCount} подзадач
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  }
                })}
              </div>
            </div>
          ))}

          {!loading && totalCount > 0 && (
            <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-800 px-4 py-2 text-center text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700">
              Найдено {totalCount} {totalCount === 1 ? 'элемент' : totalCount < 5 ? 'элемента' : 'элементов'}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}