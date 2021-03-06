const supertest = require('supertest');
const api = require('../../src/api');
const { Player } = require('../../src/database');
const { resetDatabase } = require('../utils');

const request = supertest(api);

beforeAll(async done => {
  await resetDatabase();

  await Player.create({ id: 1000000, username: 'Test Player' });
  await Player.create({ id: 200000, username: 'Alt Player' });

  done();
});

describe('Player API', () => {
  describe('Tracking', () => {
    test('Do not track valid username too soon', async done => {
      const response = await request.post('/api/players/track').send({ username: 'Test Player' });

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch('Failed to update:');

      done();
    }, 90000);

    test('Do not track undefined username', async done => {
      const response = await request.post('/api/players/track').send({});

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch('Invalid username.');

      done();
    });

    test('Do not track empty username', async done => {
      const response = await request.post('/api/players/track').send({ username: '' });

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch('Invalid username.');

      done();
    });

    test('Do not track lengthy username', async done => {
      const response = await request.post('/api/players/track').send({ username: 'ALongUsername' });

      expect(response.status).toBe(500);
      expect(response.body.message).toMatch('Validation error: Username must be between');

      done();
    });

    test('Track valid username', async done => {
      const response = await request.post('/api/players/track').send({ username: 'Psikoi' });

      if (response.status === 200) {
        expect(response.body.username).toBe('Psikoi');
      } else {
        expect(response.body.message).toMatch('Failed to load hiscores: Invalid username');
      }

      done();
    }, 90000);

    test('Track unformatted username', async done => {
      const response = await request.post('/api/players/track').send({ username: ' iron_mammal ' });

      if (response.status === 200) {
        expect(response.body.username).toBe('Iron Mammal');
      } else {
        expect(response.body.message).toMatch('Failed to load hiscores: Invalid username');
      }

      done();
    }, 90000);
  });

  describe('Importing', () => {
    test('Do not import undefined username', async done => {
      const response = await request.post('/api/players/import').send({});

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch('Invalid username.');

      done();
    });

    test('Import existing username', async done => {
      const response = await request.post('/api/players/import').send({ username: 'Test Player' });

      if (response.status === 200) {
        expect(response.body.message).toMatch('snapshots imported from CML');
      } else {
        expect(response.body.message).toMatch('Failed to load history from CML.');
      }

      done();
    }, 90000);
  });

  describe('Importing Too soon', () => {
    test('Do not import existing username too soon', async done => {
      const firstResponse = await request.post('/api/players/import').send({ username: 'Test Player' });

      // If the first response is successful, the second should fail
      if (firstResponse.status === 200) {
        const secResponse = await request.post('/api/players/import').send({ username: 'Test Player' });

        expect(secResponse.status).toBe(400);
        expect(secResponse.body.message).toMatch('Imported too soon');
      }

      done();
    });
  });

  describe('Searching', () => {
    test('Search with undefined username', async done => {
      const response = await request.get('/api/players/search').query({});

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch('Invalid username.');

      done();
    });

    test('Search for valid partial username', async done => {
      const response = await request.get('/api/players/search').query({ username: 'tes' });

      expect(response.status).toBe(200);
      expect(response.body.length).toBe(1);
      expect(response.body[0].username).toBe('Test Player');

      done();
    });

    test('Search for non-existing valid partial username', async done => {
      const response = await request.get('/api/players/search').query({ username: 'something else' });

      expect(response.status).toBe(200);
      expect(response.body.length).toBe(0);

      done();
    });
  });

  describe('Viewing', () => {
    test('View undefined username and id', async done => {
      const response = await request.get('/api/players').query({});

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch('Invalid player id.');

      done();
    });

    test('View non-existing id', async done => {
      const response = await request.get('/api/players').query({ id: 9999 });

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch('Player of id 9999 is not being tracked yet.');

      done();
    });

    test('View non-existing username', async done => {
      const response = await request.get('/api/players').query({ username: 'playerViewTest' });

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch('playerViewTest is not being tracked yet.');

      done();
    });

    test('View valid id', async done => {
      const response = await request.get('/api/players').query({ id: 1000000 });

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(1000000);

      done();
    });

    test('View valid username', async done => {
      const response = await request.get('/api/players').query({ username: 'Test Player' });

      expect(response.status).toBe(200);
      expect(response.body.username).toBe('Test Player');

      done();
    });

    test('View valid unformatted username', async done => {
      const response = await request.get('/api/players').query({ username: ' alt_player' });

      expect(response.status).toBe(200);
      expect(response.body.username).toBe('Alt Player');

      done();
    });
  });
});
