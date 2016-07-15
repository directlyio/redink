/* eslint-disable no-unused-vars */
export default (id, table, schemas, connection) => (
  new Promise((resolve, reject) => {
    resolve({
      archive: {
        enterprise: {
          100: true,
        },
        listing: {
          1111: true,
          2222: true,
        },
        ad: {
          11110: true,
          22220: true,
        },
      },
      patch: {
        enterprise: {
          100: {
            listings: {
              1111: true,
              2222: true,
            },
            ads: {
              11110: true,
              22220: true,
            },
          },
        },
        listing: {
          1111: {
            company: {
              100: true,
            },
            categories: {
              112: true,
              113: true,
            },
          },
          2222: {
            company: {
              100: true,
            },
            categories: {
              112: true,
            },
          },
        },
        ad: {
          11110: {
            company: {
              100: true,
            },
            categories: {
              112: true,
              113: true,
            },
          },
          22220: {
            company: {
              100: true,
            },
            categories: {
              112: true,
            },
          },
        },
        category: {
          112: {
            listings: {
              1111: true,
              2222: true,
            },
            ads: {
              11110: true,
              22220: true,
            },
          },
          113: {
            listings: {
              1111: true,
            },
            ads: {
              11110: true,
            },
          },
        },
      },
    });
  })
);
