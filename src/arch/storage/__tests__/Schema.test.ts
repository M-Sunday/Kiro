import { describe, it, expect } from 'vitest'
import {
  videoToDB, dbToVideo,
  noteToDB, dbToNote,
  bookmarkToDB, dbToBookmark,
  folderToDB, dbToFolder,
} from '../schema/schema'

describe('Schema mappers', () => {
  describe('videoToDB / dbToVideo', () => {
    it('should convert Video to DBVideo and back', () => {
      const video = {
        videoId: 'abc123',
        title: 'Test Video',
        channel: 'Test Channel',
        duration: '5:00',
        thumbnail: 'thumb.jpg',
        url: 'https://youtube.com/watch?v=abc123',
        added: 1000,
        blurred: true,
        archived: false,
        pubDate: '2024-01-01',
        privacy: 'PUBLIC',
      }

      const db = videoToDB(video, 'folder1')
      expect(db.id).toBe('abc123')
      expect(db.title).toBe('Test Video')
      expect(db.folder_id).toBe('folder1')
      expect(db.blurred).toBe(1)
      expect(db.archived).toBe(0)
      expect(db.pub_date).toBe('2024-01-01')
      expect(db.privacy).toBe('PUBLIC')

      const back = dbToVideo(db)
      expect(back.videoId).toBe('abc123')
      expect(back.title).toBe('Test Video')
      expect(back.blurred).toBe(true)
      expect(back.archived).toBe(false)
    })

    it('should handle nullable fields', () => {
      const video = {
        videoId: 'abc',
        title: 'Test',
        channel: '',
        duration: '',
        thumbnail: '',
        url: '',
        added: 0,
        blurred: false,
        archived: false,
      }

      const db = videoToDB(video, null)
      expect(db.folder_id).toBeNull()
      expect(db.pub_date).toBeNull()
      expect(db.privacy).toBeNull()

      const back = dbToVideo(db)
      expect(back.pubDate).toBeUndefined()
    })
  })

  describe('noteToDB / dbToNote', () => {
    it('should convert Note to DBNote and back', () => {
      const note = {
        id: 'note1',
        title: 'My Note',
        content: 'Hello world',
        folder: 'folder1',
        todos: [{ text: 'todo1', done: false }],
        added: 1000,
        updated: 2000,
      }

      const db = noteToDB(note)
      expect(db.id).toBe('note1')
      expect(db.folder_id).toBe('folder1')
      expect(db.todos).toBe('[{"text":"todo1","done":false}]')

      const back = dbToNote(db)
      expect(back.id).toBe('note1')
      expect(back.todos).toHaveLength(1)
      expect(back.todos[0]?.text).toBe('todo1')
    })

    it('should handle empty todos', () => {
      const note = {
        id: 'note2',
        title: 'Empty',
        content: '',
        folder: null,
        todos: [],
        added: 0,
        updated: 0,
      }

      const db = noteToDB(note)
      const back = dbToNote(db)
      expect(back.todos).toEqual([])
      expect(back.folder).toBeNull()
    })
  })

  describe('bookmarkToDB / dbToBookmark', () => {
    it('should convert Bookmark to DBBookmark and back', () => {
      const bm = {
        id: 'bm1',
        url: 'https://example.com',
        title: 'Example',
        image: 'img.jpg',
        added: 1000,
        blurred: true,
      }

      const db = bookmarkToDB(bm)
      expect(db.id).toBe('bm1')
      expect(db.image).toBe('img.jpg')
      expect(db.blurred).toBe(1)

      const back = dbToBookmark(db)
      expect(back.blurred).toBe(true)
      expect(back.image).toBe('img.jpg')
    })
  })

  describe('folderToDB / dbToFolder', () => {
    it('should convert Folder to DBFolder and back', () => {
      const folder = {
        name: 'My Folder',
        videoIds: ['v1', 'v2'],
        color: '#ff0000',
      }

      const db = folderToDB(folder)
      expect(db.id).toBe('My Folder')
      expect(db.name).toBe('My Folder')
      expect(db.color).toBe('#ff0000')

      const back = dbToFolder(db)
      expect(back.name).toBe('My Folder')
      expect(back.videoIds).toEqual([]) // videoIds not stored in SQLite folder
      expect(back.color).toBe('#ff0000')
    })
  })
})
