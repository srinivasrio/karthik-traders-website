
import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image, Font } from '@react-pdf/renderer';

// Define styles
const styles = StyleSheet.create({
    page: {
        padding: 40,
        fontFamily: 'Helvetica',
        fontSize: 10,
        lineHeight: 1.5,
        color: '#333',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 40,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    brandSection: {
        alignItems: 'flex-end',
    },
    brandName: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    metaSection: {
        marginBottom: 30,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    billTo: {
        width: '45%',
    },
    label: {
        fontSize: 9,
        color: '#666',
        marginBottom: 2,
        textTransform: 'uppercase',
    },
    value: {
        fontSize: 10,
        marginBottom: 10,
        fontWeight: 'medium',
    },
    // Table
    table: {
        width: 'auto',
        marginTop: 20,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderStyle: 'solid',
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
        borderBottomStyle: 'solid',
        alignItems: 'center',
        minHeight: 24,
    },
    tableHeader: {
        backgroundColor: '#f3f4f6',
        fontWeight: 'bold',
        color: '#111827',
    },
    cellItems: { width: '50%', padding: 5, borderRightWidth: 1, borderRightColor: '#e5e7eb' },
    cellPrice: { width: '20%', padding: 5, borderRightWidth: 1, borderRightColor: '#e5e7eb', textAlign: 'right' },
    cellQty: { width: '10%', padding: 5, borderRightWidth: 1, borderRightColor: '#e5e7eb', textAlign: 'center' },
    cellTotal: { width: '20%', padding: 5, textAlign: 'right' },

    // Totals
    totalsSection: {
        marginTop: 20,
        alignItems: 'flex-end',
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginBottom: 4,
    },
    totalLabel: {
        width: 100,
        textAlign: 'right',
        paddingRight: 10,
        color: '#666',
    },
    totalValue: {
        width: 100,
        textAlign: 'right',
        fontWeight: 'bold',
    },
    grandTotal: {
        backgroundColor: '#f3f4f6',
        padding: 5,
        marginTop: 5,
    },

    // Footer
    footer: {
        position: 'absolute',
        bottom: 40,
        left: 40,
        right: 40,
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
        paddingTop: 10,
    },
    footerText: {
        fontSize: 8,
        color: '#9ca3af',
        textAlign: 'center',
        marginBottom: 4,
    },

    // Payment Status
    statusStamp: {
        position: 'absolute',
        top: 200,
        right: 40,
        transform: 'rotate(-15deg)',
        borderWidth: 3,
        borderRadius: 8,
        padding: '10 20',
        opacity: 0.8,
        zIndex: 10,
    },
    statusPaid: {
        borderColor: '#22c55e',
        color: '#22c55e',
    },
    statusPending: {
        borderColor: '#f97316',
        color: '#f97316',
    },
    stampText: {
        fontSize: 24,
        fontWeight: 'black',
        textTransform: 'uppercase',
    }

});

interface InvoiceProps {
    order: any;
}

const InvoicePDF = ({ order }: InvoiceProps) => {
    const isPaid = order.payment_status === 'paid';
    const displayStatus = isPaid ? 'PAID' : 'PAYMENT PENDING';
    const statusStyle = isPaid ? styles.statusPaid : styles.statusPending;

    return (
        <Document>
            <Page size="A4" style={styles.page}>

                {/* Header */}
                <View style={styles.header}>
                    {/* Logo Section */}
                    <View>
                        {/* Ensure this path is reachable or import it. For Client Components using @react-pdf/renderer, URLs relative to public usually work locally, or absolute URLs. Best practice often is importing base64 or absolute if issues arise. Trying public path first. */}
                        {/* @ts-ignore */}
                        <Image src="/images/logo.png" style={{ width: 60, height: 60, marginBottom: 10 }} />
                    </View>
                    <View style={styles.brandSection}>
                        <Text style={styles.brandName}>KARTHIK TRADERS</Text>
                        <Text style={styles.value}>Shop no: 13, Opp. Madhura Sweets Line,</Text>
                        <Text style={styles.value}>Near MRF Tyres Line, Subedar Pet,</Text>
                        <Text style={styles.value}>Nellore, Andhra Pradesh - 524001</Text>
                        <Text style={styles.value}>GSTIN: 37AFGPY0727H1Z6</Text>
                        <Text style={styles.value}>Mobile: +91 99638 40058</Text>
                        <Text style={styles.value}>www.karthiktraders.in</Text>
                    </View>
                </View>

                {/* Invoice Info */}
                <View style={styles.metaSection}>
                    <View>
                        <Text style={styles.label}>Invoice Number</Text>
                        <Text style={styles.value}>INV-{order.order_number || order.id.slice(0, 8).toUpperCase()}</Text>
                        <Text style={styles.label}>Date</Text>
                        <Text style={styles.value}>{new Date(order.created_at).toLocaleDateString()}</Text>
                    </View>
                    <View style={styles.billTo}>
                        <Text style={styles.label}>Bill To</Text>
                        <Text style={styles.value}>{order.customer_name}</Text>
                        {/* Parse shipping address if it exists and is an object, or show raw text */}
                        <Text style={{ ...styles.value, maxWidth: 200 }}>
                            {typeof order.shipping_address === 'object'
                                ? `${order.shipping_address.street || ''}\n${order.shipping_address.city || ''}, ${order.shipping_address.state || ''} ${order.shipping_address.zip || ''}`
                                : order.shipping_address || ''}
                        </Text>
                        <Text style={styles.value}>{order.customer_mobile || ''}</Text>
                    </View>
                </View>

                {/* Payment Status Stamp */}
                <View style={[styles.statusStamp, statusStyle]}>
                    <Text style={[styles.stampText, statusStyle]}>{displayStatus}</Text>
                    {isPaid && <Text style={{ fontSize: 10, textAlign: 'center', color: '#22c55e', marginTop: 2 }}>✓ Verified</Text>}
                </View>

                {/* Table */}
                <View style={styles.table}>
                    {/* Header */}
                    <View style={[styles.tableRow, styles.tableHeader]}>
                        <Text style={styles.cellItems}>Item Description</Text>
                        <Text style={styles.cellPrice}>Price</Text>
                        <Text style={styles.cellQty}>Qty</Text>
                        <Text style={styles.cellTotal}>Total</Text>
                    </View>

                    {/* Rows */}
                    {order.order_items?.map((item: any, idx: number) => (
                        <View key={idx} style={styles.tableRow}>
                            <Text style={styles.cellItems}>{item.product?.name || 'Item'}</Text>
                            <Text style={styles.cellPrice}>₹{item.price_at_purchase?.toLocaleString()}</Text>
                            <Text style={styles.cellQty}>{item.quantity}</Text>
                            <Text style={styles.cellTotal}>₹{(item.price_at_purchase * item.quantity).toLocaleString()}</Text>
                        </View>
                    ))}
                </View>

                {/* Totals */}
                <View style={styles.totalsSection}>
                    <View style={[styles.totalRow, styles.grandTotal]}>
                        <Text style={styles.totalLabel}>Grand Total:</Text>
                        <Text style={styles.totalValue}>₹{order.total_amount?.toLocaleString()}</Text>
                    </View>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={{ ...styles.title, fontSize: 16, marginBottom: 10 }}>THANK YOU!</Text>
                    <Text style={styles.footerText}>For any questions concerning this invoice, please contact:</Text>
                    <Text style={styles.footerText}>Karthik Traders | +91 99638 40058 | support@karthiktraders.in</Text>
                    <Text style={styles.footerText}>www.karthiktraders.in</Text>
                </View>

            </Page>
        </Document>
    );
};

export default InvoicePDF;
