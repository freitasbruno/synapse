[
  {
    "schemaname": "public",
    "tablename": "activity_logs",
    "policyname": "Authenticated users can log activity",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "true"
  },
  {
    "schemaname": "public",
    "tablename": "ai_usage_logs",
    "policyname": "Authenticated users can log AI usage",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "true"
  },
  {
    "schemaname": "public",
    "tablename": "assets",
    "policyname": "Authenticated users can create assets",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "true"
  },
  {
    "schemaname": "public",
    "tablename": "assets",
    "policyname": "Managers can update any asset",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "UPDATE",
    "qual": "(EXISTS ( SELECT 1\n   FROM users\n  WHERE ((users.auth_id = auth.uid()) AND (users.role = 'manager'::text))))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "assets",
    "policyname": "Owners can delete their own assets",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "DELETE",
    "qual": "(creator_id = ( SELECT users.id\n   FROM users\n  WHERE (users.auth_id = auth.uid())))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "assets",
    "policyname": "Owners can read their own draft assets",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "SELECT",
    "qual": "(creator_id = ( SELECT users.id\n   FROM users\n  WHERE (users.auth_id = auth.uid())))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "assets",
    "policyname": "Owners can update their own assets",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "UPDATE",
    "qual": "(creator_id = ( SELECT users.id\n   FROM users\n  WHERE (users.auth_id = auth.uid())))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "assets",
    "policyname": "Public can read published assets",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "(status = 'published'::text)",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "assets",
    "policyname": "Users can delete their own assets",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "DELETE",
    "qual": "(creator_id = ( SELECT users.id\n   FROM users\n  WHERE (users.auth_id = auth.uid())))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "assets",
    "policyname": "Users can insert their own assets",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "(creator_id = ( SELECT users.id\n   FROM users\n  WHERE (users.auth_id = auth.uid())))"
  },
  {
    "schemaname": "public",
    "tablename": "assets",
    "policyname": "Users can update their own assets",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "UPDATE",
    "qual": "(creator_id = ( SELECT users.id\n   FROM users\n  WHERE (users.auth_id = auth.uid())))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "comments",
    "policyname": "Authenticated users can post comments",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "true"
  },
  {
    "schemaname": "public",
    "tablename": "comments",
    "policyname": "Public can read comments",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "true",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "comments",
    "policyname": "Users can delete their own comments",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "DELETE",
    "qual": "(user_id = ( SELECT users.id\n   FROM users\n  WHERE (users.auth_id = auth.uid())))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "system_stats",
    "policyname": "Public can read system stats",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "true",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "users",
    "policyname": "Public can read user profiles",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "true",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "users",
    "policyname": "Users can insert their own profile",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "(auth_id = auth.uid())"
  },
  {
    "schemaname": "public",
    "tablename": "users",
    "policyname": "Users can update their own profile",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "UPDATE",
    "qual": "(auth_id = auth.uid())",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "votes",
    "policyname": "Authenticated users can cast votes",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "true"
  },
  {
    "schemaname": "public",
    "tablename": "votes",
    "policyname": "Authenticated users can read votes",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "SELECT",
    "qual": "true",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "votes",
    "policyname": "Users can remove their own votes",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "DELETE",
    "qual": "(user_id = ( SELECT users.id\n   FROM users\n  WHERE (users.auth_id = auth.uid())))",
    "with_check": null
  }
]