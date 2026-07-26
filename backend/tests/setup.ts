// Env minimale pour les tests unitaires
process.env.DATABASE_URL = 'postgresql://radar:radar_secret@localhost:5432/radar_pme_test';
process.env.NODE_ENV = 'test';
process.env.DEMO_DATA = 'true';
