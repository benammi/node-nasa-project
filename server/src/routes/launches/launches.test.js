const request = require("supertest");
const app = require("../../app");
const { mongoConnect, mongoDisconnect } = require("../../services/mongo");
const { loadPlanetsData } = require("../../models/planets.model");

describe("test launches", () => {
  beforeAll(async () => {
    await mongoConnect();
    await loadPlanetsData();
  });

  afterAll(async () => {
    await mongoDisconnect();
  });

  describe("Test GET /launches", () => {
    test("should responde with 200 success", async () => {
      console.log("Test GET /launches Start");

      const response = await request(app)
        .get("/v1/launches")
        .expect("Content-Type", /json/)
        .expect(200);
      console.log("Test GET /launches done");
    });
  });

  describe("Test POST /launches", () => {
    const completLaunchData = {
      mission: "Kepler Exoploration X",
      rocket: "Explorer IS1",
      launchDate: "12/12/2050",
      target: "Kepler-452 b",
    };

    const launchDataWitoutDate = {
      mission: "Kepler Exoploration X",
      rocket: "Explorer IS1",
      target: "Kepler-452 b",
    };

    const launchDataWithInvalideDate = {
      mission: "Kepler Exoploration X",
      rocket: "Explorer IS1",
      launchDate: "test",
      target: "Kepler-452 b",
    };

    test("should response with 201 created", async () => {
      console.log("Test POST /launches start");

      const response = await request(app)
        .post("/v1/launches")
        .send(completLaunchData)
        .expect("Content-Type", /json/)
        .expect(201);

      console.log("Test POST /launches done");

      const resquestDate = new Date(completLaunchData.launchDate).valueOf();
      const responseDate = new Date(response.body.launchDate).valueOf();
      expect(resquestDate).toBe(responseDate);

      expect(response.body).toMatchObject(launchDataWitoutDate);
    });

    test("should catch missing required propreties", async () => {
      const response = await request(app)
        .post("/v1/launches")
        .send(launchDataWitoutDate)
        .expect("Content-Type", /json/)
        .expect(400);

      expect(response.body).toStrictEqual({
        error: "missing required data!!!",
      });
    });
    test("should catch invalide launch date", async () => {
      const response = await request(app)
        .post("/v1/launches")
        .send(launchDataWithInvalideDate)
        .expect("Content-Type", /json/)
        .expect(400);

      expect(response.body).toStrictEqual({
        error: "invalide launch date!!!",
      });
    });
  });
});
