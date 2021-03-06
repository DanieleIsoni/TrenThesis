//Set debug and mongoDBUrl environment variables for test purposes
process.env.mongoDBUrl = 'mongodb://localhost:27017/trenthesis';
process.env.debug = 'true';

const validProfile = {
  '_json': {
    'id': "116652383299820429186",
    'hd': 'unitn.it'
  }
}
const validProfileNoHd = {
  '_json': {
    'id': "116652383299820429186"
  }
}
const invalidProfile = {
  '_json': {
    'id': "9876545678976545678765",
    'hd': 'unitn.it'
  }
}
/* Mockup loggedIn function */
jest.mock('connect-ensure-login');
const loggedInModule = require('connect-ensure-login');
const getCallbackUrl = jest.fn()
  .mockReturnValueOnce(undefined)
  .mockReturnValueOnce('valid_url')
  .mockReturnValueOnce('%%%%%'); //invalid url
loggedInModule.ensureLoggedIn.mockImplementation((options) => {
  return (req, res, next) => {
    req.user = validProfile
    req.session.callback = getCallbackUrl()
    next();
  }
});

const request = require('supertest');
const app = require('../router');
const getTestToken = require('./utils').getTestToken;
const strategyCallback = require('./auth_routes').strategyCallback
const exec = require('child_process').exec;
console.log(getTestToken());

/*
  Function to call mongoimport
*/
function importTable(name, cb) {
  var options = '--host localhost --port 27017 --db trenthesis';
  options += ' --collection ' + name;
  options += ' --drop --maintainInsertionOrder';
  options += ' --file tools/test_populations/' + name + '.json';

  exec('mongoimport ' + options, {
    cwd: '.'
  }, (err, stdout, stderr) => {
    //console.log("Imported " + name); // + ": " + stderr);
    cb();
  })
}

function importAll(cb) {

  //Import the DB
  importTable('users', () => {
    importTable('categories', () => {
      importTable('professors', () => {
        importTable('topics', () => {
          //console.log("Test Database Loaded!");

          //Connect to DB
          app.DBConnect(() => {
            cb()
          })
        });
      });
    });
  });
}



/*Wait the DB population and connection, then do the tests*/
beforeAll((done) => {
  //Set DB to local instance
  importAll(done)
});

/*Restore the DB*/
afterAll((done) => {
  app.get('db').close(() => {
    importAll(() => {
      done();
    });
  });
})

test('Test if there is a DB connection', () => {
  var status = app.get('db').serverConfig.isConnected()
  expect(status).toBe(true);
})


describe('Test router', () => {

  /*author: Riccardo Capraro*/
  test('Get server root url, /', async () => {
    return request(app)
      .get('/')
      .then(response => {
        expect(response.statusCode).toBe(200)
      })
  });

  /*author: Riccardo Capraro*/
  test('Get invalid url, /invalidurl', async () => {
    return request(app)
      .get('/invalidurl')
      .then(response => {
        expect(response.statusCode).toBe(404)
      })
  });

  /*author: Riccardo Capraro*/
  test('Get invalid url, /invalidurl', async () => {
    return request(app)
      .get('/invalidurl')
      .then(response => {
        expect(response.statusCode).toBe(404)
      })
  });
})

/*author: Riccardo Capraro*/
test('Get api root url, /api', async () => {
  return request(app)
    .get('/api')
    .then(response => {
      expect(response.statusCode).toBe(200)
    })
});

describe('Test Get professors', () => {
  /*author: Matteo Battilana*/
  test('Get all Professors correct', async () => {
    return request(app)
      .get('/api/professors')
      .then(response => {
        expect(response.statusCode).toBe(200)
        expect(response.body[0]).toEqual({
          "id": 0,
          "first_name": "Daniele",
          "last_name": "Isoni",
          "email": "trenthesis@unitn.it",
          "department": "DISI",
          "website": "https://github.com/MassimoGirondi/TrenThesis",
          "further_info": {
            "office hours": "Mon-Tue 7AM-7PM",
            "career": "This is my career. This is my career. This is my career. This is my career. This is my career. This is my career. This is my career. This is my career."
          }
        })

        expect(response.body[2].first_name).toEqual('Matteo')
        expect(response.body[2].last_name).toEqual('Battilana')

        expect(response.body[4].first_name).toEqual('Valentina')
        expect(response.body[4].last_name).toEqual('Odorizzi')
      })
  })

  /*author: Matteo Battilana*/
  test('Get Professor by correct id', async () => {
    return request(app)
      .get('/api/professors/1')
      .then(response => {
        expect(response.statusCode).toBe(200)
        expect(response.body).toEqual({
          "id": 1,
          "first_name": "Riccardo",
          "last_name": "Capraro",
          "email": "trenthesis@unitn.it",
          "department": "DISI",
          "website": "https://github.com/MassimoGirondi/TrenThesis",
          "further_info": {
            "office hours": "Mon-Tue 7AM-7PM",
            "career": "This is my career. This is my career. This is my career. This is my career. This is my career. This is my career. This is my career. This is my career."
          }
        })
      })
  })

  /*author: Matteo Battilana*/
  test('Get Professor by wrong id', async () => {
    return request(app)
      .get('/api/professors/6')
      .then(response => {
        expect(response.statusCode).toBe(404)
      })
  })
});

describe('Test Get Topics', () => {
  /*author: Matteo Battilana*/
  test('Get all Topics correct', async () => {
    return request(app)
      .get('/api/topics')
      .then(response => {
        expect(response.statusCode).toBe(200)
        expect(response.body[0]).toEqual({
          "id": 0,
          "professor_id": 0,
          "title": "Machine learning web micro-services",
          "short_abstract": "Machine learning micro-services with Node.js",
          "description": "Empty description",
          "resource": "folder/rewritten_url",
          "assigned": false,
          "categories": ["web", "machine_learning"]
        })

        expect(response.body[2].id).toEqual(2)
        expect(response.body[2].title).toEqual('Web frameworks analysis')

        expect(response.body[3].id).toEqual(3)
        expect(response.body[3].title).toEqual('Jsp Tag library development')

      })
  })

  /*author: Daniele Isoni*/
  test('Get Topics by correct id', async () => {
    return request(app)
      .get('/api/topics/1')
      .then(response => {
        expect(response.statusCode).toBe(200)
        expect(response.body).toEqual({
          "id": 1,
          "professor_id": 1,
          "title": "Clustering algorithms with sklearn",
          "short_abstract": "Add a clustering algorithm to the scikit-learn library",
          "description": "Empty description",
          "resource": "folder/rewritten_url",
          "assigned": false,
          "categories": ["machine_learning"]
        })
      })
  })

  /*author: Daniele Isoni*/
  test('Get Topics by wrong id', async () => {
    return request(app)
      .get('/api/topics/5')
      .then(response => {
        expect(response.statusCode).toBe(404)
      })
  })
  //Must add the same as 'Test Professor Update' cases

  /*author: Valentina Odorizzi*/
  test('Get Topics by filters', async () => {
    return request(app)
      .get('/api/topics?professor_id=1&category=web')
      .then(response => {
        expect(response.statusCode).toBe(200)

        expect(response.body[0].professor_id).toEqual(1)
        expect(response.body[0].categories).toEqual(['web'])

        expect(response.body[1].professor_id).toEqual(1)
        expect(response.body[1].categories).toEqual(['web'])
      })
  })
});

describe('Test Get Categories', () => {
  /*author: Daniele Isoni*/
  test('Get all Categories correct', async () => {
    return request(app)
      .get('/api/categories')
      .then(response => {
        expect(response.statusCode).toBe(200)
        expect(response.body[0]).toEqual("machine_learning")
        expect(response.body[1]).toEqual("web")
      })
  })

  /*author: Valentina Odorizzi*/
  test('Get correct default Categories', async () => {
    return request(app)
      .get('/api/categories?get_defaults=true')
      .then(response => {
        expect(response.statusCode).toBe(200)
        expect(response.body[0]).toEqual("web")
        expect(response.body[1]).toEqual("operating systems")
        expect(response.body[2]).toEqual("compilers")
        expect(response.body[3]).toEqual("machine learning")
        expect(response.body[4]).toEqual("electronics")
        expect(response.body[5]).toEqual("mathematics")
        expect(response.body[6]).toEqual("science fiction")
      })
  })
});

describe('Test Professor Update', () => {
  /*author: Massimo Girondi*/
  test('Update correct Professor', async () => {
    return request(app)
      .put('/api/professors/1')
      .send({
        id: 1,
        first_name: 'Guido',
        last_name: 'La Barca'
      })
      .set('x-access-token', getTestToken())
      .then(response => {
        expect(response.statusCode).toBe(200)
        return request(app)
          .get('/api/professors/1')
      }).then((response) => {
        expect(response.body.first_name).toEqual('Guido')
        expect(response.body.last_name).toEqual('La Barca')
      })
  })

  /*author: Massimo Girondi*/
  test('Update wrong Professor', async () => {
    return request(app)
      .put('/api/professors/2')
      .send({
        id: 2,
        first_name: 'Guido',
        last_name: 'La Barca'
      })
      .set('x-access-token', getTestToken())
      .then(response => {
        expect(response.statusCode).toBe(403)
      })
  })

  /*author: Valentina Odorizzi*/
  test('Update correct professor without edit data', async () => {
    return request(app)
      .put('/api/professors/1')
      .send({
        id: 1,
        first_name: 'Guido',
        last_name: 'La Barca'
      })
      .set('x-access-token', getTestToken())
      .then(response => {
        expect(response.statusCode).toBe(200)
        expect(response.body.modify).toEqual(false)
      })
  })

  /*author: Riccardo Capraro*/
  test('Update correct professor with mismatching id in body', async () => {
    return request(app)
      .put('/api/professors/1')
      .send({
        id: 2,
        first_name: 'Guido',
        last_name: 'La Barca'
      })
      .set('x-access-token', getTestToken())
      .then(response => {
        expect(response.statusCode).toBe(403)
        expect(response.body.message).toEqual('Malicious update detected: you are not allowed to put a different id in the body of the request.')
      })
  })
})

describe('Test Topic Update', () => {
  /*author: Daniele Isoni*/
  test('Update correct Topic', async () => {
    return request(app)
      .put('/api/topics/1')
      .send({
        id: 1,
        professor_id: 1,
        title: 'Clustering algorithms with sklearn modified',
        description: 'Empty description empty description'
      })
      .set('x-access-token', getTestToken())
      .then(response => {
        expect(response.statusCode).toBe(200)
        return request(app)
          .get('/api/topics/1')
      }).then((response) => {
        expect(response.body.title).toEqual('Clustering algorithms with sklearn modified')
        expect(response.body.description).toEqual('Empty description empty description')
      })
  })

  /*author: Daniele Isoni*/
  test('Update wrong Topic', async () => {
    return request(app)
      .put('/api/topics/2')
      .send({
        id: 2,
        professor_id: 2,
        title: 'Clustering algorithms with sklearn modified',
        description: 'Empty description empty description'
      })
      .set('x-access-token', getTestToken())
      .then(response => {
        expect(response.statusCode).toBe(403)
      })
  })

  /*author: Valentina Odorizzi*/
  test('Update correct Topic without edit data', async () => {
    return request(app)
      .put('/api/topics/1')
      .send({
        id: 1,
        professor_id: 1,
        title: 'Clustering algorithms with sklearn modified',
        description: 'Empty description empty description'
      })
      .set('x-access-token', getTestToken())
      .then(response => {
        expect(response.statusCode).toBe(200)
        expect(response.body.modify).toEqual(false)
      })
  })

  /*author: Riccardo Capraro*/
  test('Update correct topic with mismatching id in body', async () => {
    return request(app)
      .put('/api/topics/1')
      .send({
        id: 2,
        professor_id: 1,
        title: 'Clustering algorithms with sklearn modified',
        description: 'Empty description empty description'
      })
      .set('x-access-token', getTestToken())
      .then(response => {
        expect(response.statusCode).toBe(403)
        expect(response.body.message).toEqual('Malicious update detected: you are not allowed to put a different id in the body of the request.')
      })
  })
})


/*author: Massimo Girondi*/
describe('Test Topic Remove', () => {
  test('Remove correct Topic without authentication', async () => {
    return request(app)
      .delete('/api/topics/0')
      .then(response => {
        expect(response.statusCode).toBe(400)
      })
  })

  /*author: Massimo Girondi*/
  test('Remove correct Topic', async () => {
    return request(app)
      .delete('/api/topics/1')
      .set('x-access-token', getTestToken())
      .then(response => {
        expect(response.statusCode).toBe(200)
        return request(app)
          .get('/api/topics/1')
      }).then((response) => {
        expect(response.statusCode).toBe(404)
      })
  })

  /*author: Massimo Girondi*/
  test('Remove invalid Topic', async () => {
    return request(app)
      .delete('/api/topics/1')
      .set('x-access-token', getTestToken())
      .then(response => {
        expect(response.statusCode).toBe(400)
      })
  })

  /*author: Massimo Girondi*/
  test('Remove wrong Topic, wrong id', async () => {
    return request(app)
      .put('/api/topics/8')
      .set('x-access-token', getTestToken())
      .then(response => {
        expect(response.statusCode).toBe(400)
      })
  })

  /*author: Massimo Girondi*/
  test('Remove wrong Topic, other topic', async () => {
    return request(app)
      .put('/api/topics/0')
      .set('x-access-token', getTestToken())
      .then(response => {
        expect(response.statusCode).toBe(400)
      })
  })
})

describe('Test Professor Remove', () => {
  /*author: Matteo Battilana*/
  test('Remove correct Professor without authentication', async () => {
    return request(app)
      .delete('/api/professors/2')
      .then(response => {
        expect(response.statusCode).toBe(403)
      })
  })

  /*author: Matteo Battilana*/
  test('Remove correct Professor', async () => {
    return request(app)
      .delete('/api/professors/1')
      .set('x-access-token', getTestToken())
      .then(response => {
        expect(response.statusCode).toBe(200)
        return request(app)
          .get('/api/professors/1')
      }).then((response) => {
        expect(response.statusCode).toBe(404)
      })
  })

  /*author: Massimo Girondi*/
  test('Remove invalid Professor', async () => {
    return request(app)
      .delete('/api/professors/1')
      .set('x-access-token', getTestToken())
      .then(response => {
        expect(response.statusCode).toBe(400)
      })
  })

  /*author: Matteo Battilana*/
  test('Remove wrong Professor, wrong id', async () => {
    return request(app)
      .put('/api/professors/8')
      .set('x-access-token', getTestToken())
      .then(response => {
        expect(response.statusCode).toBe(403)
      })
  })

  /*author: Matteo Battilana*/
  test('Remove wrong Professor, other professor', async () => {
    return request(app)
      .put('/api/professors/0')
      .set('x-access-token', getTestToken())
      .then(response => {
        expect(response.statusCode).toBe(403)
      })
  })
})

/*author: Valentina Odorizzi*/
describe('Test Topic Insert', () => {

  /*author: Valentina Odorizzi*/
  test('Insert new correct topic', async () => {
    return request(app)
      .post('/api/topics')
      .send({
        professor_id: 1,
        title: 'Title',
        description: 'Description'
      })
      .then(response => {
        expect(response.statusCode).toBe(200)
        return request(app)
          .get('/api/topics/' + response.body.id)
          .then(response => {
            expect(response.body.title).toBe('Title')
            expect(response.body.description).toBe('Description')
          })
      })
  });

  /*author: Valentina Odorizzi*/
  test('Insert new topic without authentication', async () => {
    return request(app)
      .post('/api/topics')
      .set('x-access-token', getTestToken())
      .send({
        professor_id: 2,
        title: 'Title',
        description: 'Description'
      })
      .then(response => {
        expect(response.statusCode).toBe(403)
      })
  });
})


/*author: Riccardo Capraro*/
describe('Test the authenticaton API', () => {

  /*author: Riccardo Capraro*/
  test('Test auth root url, /auth', async () => {
    return request(app)
      .get('/auth')
      .then(response => {
        expect(response.statusCode).toBe(200)
      })
  });

  /*author: Riccardo Capraro*/
  test('Test auth login url, /auth/login, without user in request', async () => {
    let invariableResponseSubstring = /.*" Note that you are already loggedIn."/
    return request(app)
      .get('/auth/login')
      .then(response => {
        let itsResponse = invariableResponseSubstring.exec(response.body.message)
        expect(response.statusCode).toBe(200)
        expect(itsResponse).toBe(null)
      })
  });

  /*author: Riccardo Capraro*/
  test('Test authentication, /auth/google', async () => {
    return request(app)
      .get('/auth/google?callback=/')
      .then(response => {
        expect(response.statusCode).toBe(302)
      })
  });


  /*author: Riccardo Capraro*/
  describe('Test the auth_routes strategy callback', () => {

    const mockRequest = {
      'app': app
    }

    /* Set DEBUG to false to test passport auth strategy callback before test*/
    beforeAll(() => {
      process.env.debug = false
    });
    /*reset DEBUG to true after test */
    afterAll(() => {
      process.env.debug = 'true'
    });

    /*author: Riccardo Capraro*/
    test('Test strategyCallback with invalid email address (no hd provided)', async () => {
      strategyCallback(mockRequest, null, null, validProfileNoHd, () => {})
    });

    /*author: Riccardo Capraro*/
    test('Test strategyCallback with valid email address (hd provided and valid)', async () => {
      strategyCallback(mockRequest, null, null, validProfile, () => {})
    });

    /*author: Riccardo Capraro*/
    test('Test strategyCallback with valid email address and with id not in db', async () => {
      strategyCallback(mockRequest, null, null, invalidProfile, () => {})
    });
  })

  /*author: Riccardo Capraro*/
  test('Test authentication, /auth/google', async () => {
    return request(app)
      .get('/auth/google?callback=/')
      .then(response => {
        expect(response.statusCode).toBe(302)
      })
  });

  /*author: Riccardo Capraro*/
  test('Test to get the token with a correct logged in user and no callback url', async () => {
    let invariableTokenSubstring = /[a-zA-Z0-9]+"."[a-zA-Z0-9]+"."/

    return request(app)
      .get('/auth/token')
      .then(response => {
        //expect(response.body).toBe(1)
        expect(response.statusCode).toBe(200)
        let itsResponse = invariableTokenSubstring.exec(response.body.token)
        let itsExpected = invariableTokenSubstring.exec(getTestToken())
        expect(itsResponse).toBe(itsExpected)
      })
  });

  /*author: Riccardo Capraro*/
  test('Test to get the token with a correct logged in user and valid callback url', async () => {
    let invariableTokenSubstring = /[a-zA-Z0-9]+"."[a-zA-Z0-9]+"."/

    return request(app)
      .get('/auth/token')
      .then(response => {
        expect(response.statusCode).toBe(302)
      })
  });

  /*author: Riccardo Capraro*/
  test('Test to get the token with a correct logged in user and invalid callback url', async () => {
    let invariableTokenSubstring = /[a-zA-Z0-9]+"."[a-zA-Z0-9]+"."/

    return request(app)
      .get('/auth/token')
      .then(response => {
        expect(response.statusCode).toBe(422)
      })
  });

  /*author: Riccardo Capraro*/
  test('Test GET not authorized url, /auth/not_authorized', async () => {
    return request(app)
      .get('/auth/not_authorized')
      .then(response => {
        expect(response.statusCode).toBe(401)
      })
  });

  /*author: Riccardo Capraro*/
  test('Test GET profile with token, /auth/profile', async () => {
    return request(app)
      .get('/auth/profile')
      .set('x-access-token', getTestToken())
      .then(response => {
        expect(response.statusCode).toBe(200)
        expect(response.body).toEqual({
          "id": 1,
          "first_name": "Riccardo",
          "last_name": "Capraro",
          "email": "trenthesis@unitn.it",
          "department": "DISI",
          "website": "https://github.com/MassimoGirondi/TrenThesis",
          "further_info": {
            "office hours": "Mon-Tue 7AM-7PM",
            "career": "This is my career. This is my career. This is my career. This is my career. This is my career. This is my career. This is my career. This is my career."
          }
        })
      })
  });
})


describe('Test GET statistics', () => {

  /*author: Riccardo Capraro*/
  test('Test GET statistics with no target param', () => {
    return request(app)
      .get('/api/statistics')
      .then(response => {
        expect(response.statusCode).toBe(200)
      })
  })

  /*author: Riccardo Capraro*/
  test('Test GET statistics with target param = top_topics', () => {
    return request(app)
      .get('/api/statistics?target=top_professor_categories')
      .then(response => {
        expect(response.statusCode).toBe(200)
      })
  })

  /*author: Riccardo Capraro*/
  test('Test GET statistics with wrong target param = wrong', () => {
    return request(app)
      .get('/api/statistics?target=wrong')
      .then(response => {
        expect(response.statusCode).toBe(404)
      })
  })

  /*author: Riccardo Capraro*/
  test('Test GET statistics/profile with an authenticated token', () => {
    return request(app)
      .get('/api/statistics/profile')
      .set('x-access-token', getTestToken())
      .then(response => {
        expect(response.statusCode).toBe(200)
      })
  })
})



/* MIND THAT AFTER THIS LINE WE CLOSE THE DATABASE */
describe('Test internal errors in API', () => {


  /*author: Riccardo Capraro*/
  test('Try to close the db connection', () => {
    app.get('db').close()
    var status = app.get('db').serverConfig.isConnected()
    expect(status).toBe(false);
  })

  /*author: Riccardo Capraro*/
  test('Get Professor with no db connectio', async () => {
    return request(app)
      .get('/api/professors/1')
      .then(response => {
        expect(response.statusCode).toBe(505)
      })
  })

  /*author: Riccardo Capraro*/
  test('Get all professors with no db connection', async () => {
    return request(app)
      .get('/api/professors')
      .then(response => {
        expect(response.statusCode).toBe(505)
      })
  })

  /*author: Riccardo Capraro*/
  test('Get all topics with no db connection', async () => {
    return request(app)
      .get('/api/topics')
      .then(response => {
        expect(response.statusCode).toBe(505)
      })
  })

  /*author: Riccardo Capraro*/
  test('Get specific topic with no db connection', async () => {
    return request(app)
      .get('/api/topics/1')
      .then(response => {
        expect(response.statusCode).toBe(505)
      })
  })

  /*author: Riccardo Capraro*/
  test('Remove correct Topic with no db connection', async () => {
    return request(app)
      .delete('/api/topics/1')
      .set('x-access-token', getTestToken())
      .then(response => {
        expect(response.statusCode).toBe(505)
      })
  })

  /*author: Riccardo Capraro*/
  test('Update correct Topic with no db connection', async () => {
    return request(app)
      .put('/api/topics/1')
      .send({
        id: 1,
        professor_id: 1,
        title: 'Clustering algorithms with sklearn modified',
        description: 'Empty description empty description'
      })
      .set('x-access-token', getTestToken())
      .then(response => {
        expect(response.statusCode).toBe(505)
      })
  })

  /*author: Riccardo Capraro*/
  test('Remove correct Professor with no db connection', async () => {
    return request(app)
      .delete('/api/professors/1')
      .set('x-access-token', getTestToken())
      .then(response => {
        expect(response.statusCode).toBe(505)
      })
  })

  /*author: Riccardo Capraro*/
  test('Update correct Professor with no db connection', async () => {
    return request(app)
      .put('/api/professors/1')
      .send({
        id: 1,
        first_name: 'Guido',
        last_name: 'La Barca'
      })
      .set('x-access-token', getTestToken())
      .then(response => {
        expect(response.statusCode).toBe(505)
      })
  })
})