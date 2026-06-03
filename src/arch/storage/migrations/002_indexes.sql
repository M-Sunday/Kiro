CREATE INDEX IF NOT EXISTS idx_videos_folder_id ON videos(folder_id);
CREATE INDEX IF NOT EXISTS idx_videos_added ON videos(added);
CREATE INDEX IF NOT EXISTS idx_videos_updated ON videos(updated);
CREATE INDEX IF NOT EXISTS idx_videos_title ON videos(title);

CREATE INDEX IF NOT EXISTS idx_notes_folder_id ON notes(folder_id);
CREATE INDEX IF NOT EXISTS idx_notes_updated ON notes(updated);
CREATE INDEX IF NOT EXISTS idx_notes_added ON notes(added);

CREATE INDEX IF NOT EXISTS idx_bookmarks_added ON bookmarks(added);
CREATE INDEX IF NOT EXISTS idx_direct_access_added ON direct_access(added);
CREATE INDEX IF NOT EXISTS idx_external_files_added ON external_files(added);
CREATE INDEX IF NOT EXISTS idx_permissions_type ON permissions(type);
