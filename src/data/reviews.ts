export interface Review {
    id: number;
    name: string;
    rating: number;
    text: string;
    image?: string;
    sourceLink: string;
}

export const reviews: Review[] = [
    {
        id: 1,
        name: "DS FISHERS",
        rating: 5,
        text: "Excellent service and quality",
        image: "/images/reviewers/ds_fishers.png",
        sourceLink: "https://maps.app.goo.gl/ERWx5o99e91uzZgr7"
    },
    {
        id: 2,
        name: "Yashmaster Yashmaster",
        rating: 5,
        text: "Good quality and service",
        image: "https://lh3.googleusercontent.com/a-/ALV-UjXJNjDcxx1a-s67QrFRKYde6qbh4Q8qeJDisV4lCbF8n4umVcgK=w72-h72-p-rp-mo-br100",
        sourceLink: "https://maps.app.goo.gl/M2rC5u6hqVPMSbNP9"
    },
    {
        id: 3,
        name: "Ayan Khan",
        rating: 5,
        text: "I recently purchased sea boss aerator in karthik traders mainly I like the quality and price.",
        image: "https://lh3.googleusercontent.com/a/ACg8ocIDOvOh5HiX1D-fhjF7Rrd_XeJG23DXV2g2oIl6shYHhCpyDIA=w72-h72-p-rp-mo-br100",
        sourceLink: "https://maps.app.goo.gl/1gkEeDRGDs2rdcMH8"
    },
    {
        id: 4,
        name: "Srinivas Kumar Kollapudi",
        rating: 5,
        text: "Very satisfied with the product quality and excellent service from Karthik Traders",
        image: "https://lh3.googleusercontent.com/a-/ALV-UjVczElYGdvXnOYnqfJRmOF2onPerZS1vEro4MVoCnZ8mB93mll0XL_XWd9r3usUup3Foc2FFt4dg7QWxBDBrv8eR7YrA5iKZWPYnls62OwLl-CQA1ZLicmse8LLzu6OVHJVzqCT0cNmy1ocMZY0ExT7UigDnvr2pyRoXAKjbzdZBhyhpZwzneIGpFSMxYWlh_gx6ZYPQ2QZel8RNBQEC92NSm8Ol4ZErDY4I1RFXq66cU-9_AN_sORoNtWoeK8dIMrpNbur07caVH1Kbu0SsDn2gnQeX99uSKRJP9x_ea492ny36WnwZkmRBML-V4PVOM-j7AvD5s_DEBa0mwbgBZEXcK84ggnWtDQv6louKjDTjjFOdSOQPSJie3Njr5hR9tmNKERlb3sOe8WMHPWmmTm_0ESOIYSQ0sabiUJpCVhZCmN3NiMPSpbxsQ0_6oGvYi1sCdW1k4aHSIiIX52A8Bs_dt26w3uEOMu1Q0myysmow_A15H8bnojnQthnfkLcwhtYcw9R-g48YgpaI3XoOXLbIm4oXiLL8Cigqlj2QEK3Lphqr4irfxn3wt6zKWpRStZRyW566qIDCiqFrhW4YZZHFlGbEKBBY79kFeteNOlpojyfluQSWmFeODvZ83CKhYmJG7OGABM9_Yh9VYePvJwf2TVnSVjrCOGAXrXW-QWVAaQaUJ-aBhUXkxKMZSBzrcoYdJEDneKXsKfFnv-55SAeiPxwWy6lET258aixQdeYy5KBPN1wjjgSJvkuBQdbf4CoQCz5pwBR8O-yyf5ntmk0At5exCJwA9DQ2C-hhbU90zI6y5_B0FodzNW8A6A9GXoJur16pPEyI2ggYiydUep5HHBqUDfyE3HtAeYCVw4Eqvd33NpgamwPducSUB0FNpJTt0OMXAOh-rApJu8YydkUDM66s1ztDOoE5Oh_VEtjKTovG22Mlu2X45v8sfmTuLTGcxpcwhzYdr2dlfMFw54b3Banls6IKghhjmpbkYy_Va9-4jOguN1qSxyd71PQ8dk2c5Aq44DXmITrX1eWy8aBoUCqYmoSu5hLO4KVpv3L9coDhUiWzTkF9Q=w72-h72-p-rp-mo-ba3-br100",
        sourceLink: "https://maps.app.goo.gl/UJbNukcXJD5maY4j6"
    }
];
