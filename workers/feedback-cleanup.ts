const RETENTION_DAYS = 90;

export default {
  async scheduled(_controller, env): Promise<void> {
    const expiresBefore = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString();
    const result = await env.FEEDBACK_DB.prepare(
      'DELETE FROM feedback_entries WHERE created_at < ?',
    )
      .bind(expiresBefore)
      .run();

    console.log(
      JSON.stringify({
        event: 'feedback_retention_cleanup',
        deletedRows: result.meta.changes,
      }),
    );
  },
} satisfies ExportedHandler<Env>;
