const { ManufacturingOrder } = require('./models/ManufacturingOrder');

const sampleData = {
    numeroOF: "OF-TEST",
    NumComd: "CABLE-TEST",
    QTA: 100,
    DateLiv: { toDate: () => new Date() },
    status: "en cours"
};

try {
    console.log('Testing fromJson...');
    const order = ManufacturingOrder.fromJson(sampleData);
    console.log('Order created successfully:', order.reference);

    console.log('Testing toJson...');
    const json = order.toJson();
    console.log('JSON produced successfully:', json.status);

    const missingStatusData = { ...sampleData };
    delete missingStatusData.status;
    console.log('Testing missing status...');
    const order2 = ManufacturingOrder.fromJson(missingStatusData);
    console.log('JSON 2 produced successfully:', order2.toJson().status);

    process.exit(0);
} catch (e) {
    console.error('Model Test Failed:', e.message);
    process.exit(1);
}
