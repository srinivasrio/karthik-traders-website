import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image, Font } from '@react-pdf/renderer';

// Define styles
const styles = StyleSheet.create({
    page: {
        padding: 30,
        fontFamily: 'Helvetica',
        fontSize: 10,
        lineHeight: 1.4,
        color: '#111', // Darker text per request
    },
    // Top Header Row: GST/Addr (Left) | Brand (Center) | Logo (Right)
    topHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 20,
    },
    topLeft: {
        width: '35%',
    },
    topCenter: {
        width: '30%',
        alignItems: 'center',
        paddingTop: 10,
    },
    topRight: {
        width: '35%',
        alignItems: 'flex-end',
    },

    // Brand
    brandName: {
        fontSize: 18,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        textAlign: 'center',
        marginBottom: 4,
    },

    // GST & Address
    gstText: {
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    addressLabel: {
        fontSize: 9,
        fontWeight: 'bold',
        textDecoration: 'underline',
        marginBottom: 2,
    },
    addressLine: {
        fontSize: 9,
        marginBottom: 1,
    },

    // Main Title
    invoiceTitle: {
        fontSize: 28,
        fontWeight: 'bold', // changed from extra-bold
        marginTop: 20,
        marginBottom: 10,
        textTransform: 'uppercase',
    },

    metaSection: {
        marginBottom: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
        paddingTop: 10,
    },
    billTo: {
        width: '45%',
    },
    label: {
        fontSize: 8,
        color: '#444',
        marginBottom: 2,
        textTransform: 'uppercase',
        fontWeight: 'bold',
    },
    value: {
        fontSize: 10,
        marginBottom: 8,
        // fontWeight medium removed (default normal)
    },
    // Table
    table: {
        width: 'auto',
        marginTop: 10,
        borderWidth: 1,
        borderColor: '#000', // darker border
        borderStyle: 'solid',
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#000',
        borderBottomStyle: 'solid',
        alignItems: 'center',
        minHeight: 24,
    },
    tableHeader: {
        backgroundColor: '#f3f4f6',
        fontWeight: 'bold',
        color: '#000',
    },
    cellItems: { width: '50%', padding: 5, borderRightWidth: 1, borderRightColor: '#000' },
    cellPrice: { width: '20%', padding: 5, borderRightWidth: 1, borderRightColor: '#000', textAlign: 'right' },
    cellQty: { width: '10%', padding: 5, borderRightWidth: 1, borderRightColor: '#000', textAlign: 'center' },
    cellTotal: { width: '20%', padding: 5, textAlign: 'right' },

    // Totals
    totalsSection: {
        marginTop: 10,
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
        color: '#000',
        fontWeight: 'bold',
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
        bottom: 30,
        left: 30,
        right: 30,
        borderTopWidth: 1,
        borderTopColor: '#000',
        paddingTop: 10,
        alignItems: 'center',
    },

    // Payment Status
    statusStamp: {
        position: 'absolute',
        top: 250,
        right: 40,
        transform: 'rotate(-15deg)',
        borderWidth: 4,
        borderRadius: 8,
        padding: '10 20',
        opacity: 0.6,
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
        fontWeight: 'bold', // changed from black
        textTransform: 'uppercase',
    },

    // Restored/Updated Footer Styles
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 10,
        textTransform: 'uppercase',
    },
    footerText: {
        fontSize: 9,
        color: '#111',
        textAlign: 'center',
        marginBottom: 3,
        // fontWeight medium removed
    },
    footerWebsite: {
        fontSize: 11,
        fontWeight: 'bold', // Bold Black as requested
        color: '#000',
        textAlign: 'center',
        marginTop: 5,
        textDecoration: 'none',
    }
});

interface InvoiceProps {
    order: any;
}

const InvoicePDF = ({ order }: InvoiceProps) => {
    return (
        <Document>
            <Page size="A4" style={styles.page}>

                {/* Header: Brand & Logo */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottomWidth: 1, borderBottomColor: '#000', paddingBottom: 10 }}>
                    <Text style={{ fontSize: 24, fontWeight: 'bold', textTransform: 'uppercase', width: '70%' }}>KARTHIK TRADERS</Text>
                    <View style={{ width: '30%', alignItems: 'flex-end' }}>
                        <Image src="/images/logo-small.png" style={{ width: 60, height: 60 }} />
                    </View>
                </View>

                {/* Body Top: Title & Seller Address */}
                <View style={{ marginBottom: 20 }}>
                    <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 10, textTransform: 'uppercase' }}>INVOICE</Text>

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        {/* Left: Seller Details */}
                        <View style={{ width: '50%' }}>
                            <Text style={styles.gstText}>GSTIN: 37AFGPY0727H1Z6</Text>
                            <Text style={styles.addressLabel}>From:</Text>
                            <Text style={styles.addressLine}>Shop no 13, Opp. Madhura Sweets Line,</Text>
                            <Text style={styles.addressLine}>Near MRF Tyres Line, Subedar Pet,</Text>
                            <Text style={styles.addressLine}>Nellore, Andhra Pradesh - 524001.</Text>
                            <Text style={{ ...styles.addressLine, marginTop: 4, fontWeight: 'bold' }}>Mobile: +91 99638 40058</Text>

                            <View style={{ marginTop: 12 }}>
                                <Text style={{ fontSize: 10, fontWeight: 'bold' }}>
                                    Payment Status: <Text style={{ color: order.payment_status === 'paid' ? '#22c55e' : '#f97316' }}>
                                        {order.payment_status === 'paid' ? 'PAID' : 'PENDING'}
                                    </Text>
                                </Text>
                            </View>
                        </View>

                        {/* Right: Invoice Info */}
                        <View style={{ width: '40%' }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
                                <Text style={styles.label}>Invoice No:</Text>
                                <Text style={styles.value}>INV-{order.order_number || (typeof order.id === 'string' ? order.id.slice(0, 8).toUpperCase() : '0000')}</Text>
                            </View>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
                                <Text style={styles.label}>Date:</Text>
                                <Text style={styles.value}>{new Date(order.created_at || Date.now()).toLocaleDateString()}</Text>
                            </View>
                            <View style={{ marginTop: 10 }}>
                                <Text style={styles.label}>Bill To:</Text>
                                <Text style={{ fontSize: 10, fontWeight: 'bold', marginBottom: 2 }}>{order.customer_name || 'Valued Customer'}</Text>
                                <Text style={{ fontSize: 9, marginBottom: 8, maxWidth: 150 }}>
                                    {order.shipping_address && typeof order.shipping_address === 'object'
                                        ? [
                                            order.shipping_address.address || order.shipping_address.street || '',
                                            order.shipping_address.city || '',
                                            order.shipping_address.state || '',
                                            order.shipping_address.pincode || order.shipping_address.zip || ''
                                        ].filter(Boolean).join(', ')
                                        : (typeof order.shipping_address === 'string' ? order.shipping_address : '')}
                                </Text>
                                <Text style={{ fontSize: 9 }}>{order.customer_mobile || ''}</Text>
                            </View>
                        </View>
                    </View>
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
                    {order.order_items?.map((item: any, idx: number) => {
                        const price = Number(item.price_at_purchase || 0);
                        const qty = Number(item.quantity || 0);
                        const total = price * qty;
                        return (
                            <View key={idx} style={styles.tableRow}>
                                <Text style={styles.cellItems}>{item.product?.name || 'Item'}</Text>
                                <Text style={styles.cellPrice}>Rs. {price.toLocaleString()}</Text>
                                <Text style={styles.cellQty}>{qty}</Text>
                                <Text style={styles.cellTotal}>Rs. {total.toLocaleString()}</Text>
                            </View>
                        );
                    })}
                </View>

                {/* Totals */}
                <View style={styles.totalsSection}>
                    {Number(order.discount_amount) > 0 && (
                        <>
                            <View style={styles.totalRow}>
                                <Text style={styles.totalLabel}>Subtotal:</Text>
                                <Text style={styles.totalValue}>Rs. {(Number(order.total_amount || 0) + Number(order.discount_amount || 0)).toLocaleString()}</Text>
                            </View>
                            <View style={styles.totalRow}>
                                <Text style={[styles.totalLabel, { color: '#15803d' }]}>Discount {order.coupon_code ? `(${order.coupon_code})` : ''}:</Text>
                                <Text style={[styles.totalValue, { color: '#15803d' }]}>- Rs. {Number(order.discount_amount || 0).toLocaleString()}</Text>
                            </View>
                        </>
                    )}
                    <View style={[styles.totalRow, styles.grandTotal]}>
                        <Text style={styles.totalLabel}>Grand Total:</Text>
                        <Text style={styles.totalValue}>Rs. {Number(order.total_amount || 0).toLocaleString()}</Text>
                    </View>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.title}>THANK YOU!</Text>
                    <Text style={styles.footerText}>For any questions concerning this invoice, please contact:</Text>
                    <Text style={styles.footerText}>Karthik Traders | +91 99638 40058 | karthiktrader111@gmail.com</Text>
                    <Text style={styles.footerWebsite}>www.karthiktraders.in</Text>
                </View>

            </Page>
        </Document>
    );
};

export default InvoicePDF;
