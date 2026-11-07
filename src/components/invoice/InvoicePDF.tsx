"use client";

import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';
import { allProducts } from '@/data/products';

function numberToIndianWords(num: number): string {
    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const n = Math.round(num);
    if (n === 0) return 'Zero Rupees Only';

    function inWords(val: number): string {
        let str = '';
        if (val > 99) {
            str += a[Math.floor(val / 100)] + 'Hundred ';
            val %= 100;
        }
        if (val > 19) {
            str += b[Math.floor(val / 10)] + (val % 10 !== 0 ? ' ' + a[val % 10] : ' ');
        } else if (val > 0) {
            str += a[val];
        }
        return str;
    }

    const crore = Math.floor(n / 10000000);
    const lakh = Math.floor((n % 10000000) / 100000);
    const thousand = Math.floor((n % 100000) / 1000);
    const remaining = n % 1000;

    let res = '';
    if (crore > 0) res += inWords(crore) + 'Crore ';
    if (lakh > 0) res += inWords(lakh) + 'Lakh ';
    if (thousand > 0) res += inWords(thousand) + 'Thousand ';
    if (remaining > 0) res += inWords(remaining);

    return `Rupees ${res.trim()} Only`;
}

const styles = StyleSheet.create({
    page: {
        padding: 28,
        fontFamily: 'Helvetica',
        fontSize: 9,
        lineHeight: 1.35,
        color: '#1E293B',
        backgroundColor: '#FFFFFF',
    },
    // Top Brand Bar
    headerBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        borderBottomWidth: 2,
        borderBottomColor: '#0A1F5C',
        paddingBottom: 12,
        marginBottom: 12,
    },
    brandContainer: {
        width: '64%',
    },
    logoAndTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    topLogo: {
        width: 46,
        height: 46,
        marginRight: 8,
        objectFit: 'contain',
    },
    nameAndTaglineCol: {
        flexDirection: 'column',
        justifyContent: 'center',
    },
    brandName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#0A1F5C',
        lineHeight: 1.2,
        marginBottom: 2,
    },
    brandTagline: {
        fontSize: 7.5,
        fontWeight: 'bold',
        color: '#1D4ED8',
        textTransform: 'uppercase',
        lineHeight: 1.2,
    },
    companyDetailsBlock: {
        flexDirection: 'column',
        marginTop: 2,
    },
    addressLine: {
        fontSize: 7.5,
        color: '#475569',
        lineHeight: 1.3,
        marginBottom: 1,
    },
    supportLine: {
        fontSize: 7.5,
        fontWeight: 'bold',
        color: '#1E293B',
        lineHeight: 1.35,
        marginTop: 1,
    },
    gstinLine: {
        fontSize: 8,
        fontWeight: 'bold',
        color: '#0A1F5C',
        lineHeight: 1.35,
        marginTop: 2,
    },

    // Invoice Meta (Right side)
    metaContainer: {
        width: '33%',
        alignItems: 'flex-end',
    },
    taxInvoicePill: {
        backgroundColor: '#0A1F5C',
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: 'bold',
        paddingVertical: 3.5,
        paddingHorizontal: 9,
        borderRadius: 4,
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    copyType: {
        fontSize: 7,
        color: '#64748B',
        textTransform: 'uppercase',
        marginBottom: 6,
    },
    invNumber: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#0A1F5C',
        marginBottom: 2,
    },
    invDate: {
        fontSize: 8,
        color: '#475569',
        marginBottom: 4,
    },
    paidBadge: {
        backgroundColor: '#DCFCE7',
        paddingVertical: 2,
        paddingHorizontal: 8,
        borderRadius: 3,
        marginTop: 2,
    },
    paidBadgeText: {
        color: '#15803D',
        fontSize: 7.5,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    pendingBadge: {
        backgroundColor: '#FEF3C7',
        paddingVertical: 2,
        paddingHorizontal: 8,
        borderRadius: 3,
        marginTop: 2,
    },
    pendingBadgeText: {
        color: '#B45309',
        fontSize: 7.5,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },

    // Customer & Shipping Info Box
    customerSection: {
        flexDirection: 'row',
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 6,
        padding: 9,
        marginBottom: 12,
        justifyContent: 'space-between',
    },
    customerCol: {
        width: '48%',
    },
    sectionHeading: {
        fontSize: 7.5,
        fontWeight: 'bold',
        color: '#64748B',
        textTransform: 'uppercase',
        marginBottom: 3,
    },
    customerName: {
        fontSize: 9.5,
        fontWeight: 'bold',
        color: '#0A1F5C',
        marginBottom: 2,
    },
    customerText: {
        fontSize: 8,
        color: '#334155',
        lineHeight: 1.3,
    },

    // Items Table
    table: {
        borderRadius: 6,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#CBD5E1',
        marginBottom: 10,
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#0A1F5C',
        alignItems: 'center',
        minHeight: 22,
    },
    tableHeaderCell: {
        color: '#FFFFFF',
        fontSize: 8,
        fontWeight: 'bold',
        paddingVertical: 4,
        paddingHorizontal: 6,
    },
    tableRow: {
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: 20,
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
    },
    tableRowEven: {
        backgroundColor: '#F8FAFC',
    },
    cellSno: {
        width: '7%',
        textAlign: 'center',
        fontSize: 8,
        paddingVertical: 3.5,
        paddingHorizontal: 4,
    },
    cellDesc: {
        width: '51%',
        fontSize: 8,
        paddingVertical: 3.5,
        paddingHorizontal: 6,
    },
    cellPrice: {
        width: '16%',
        textAlign: 'right',
        fontSize: 8,
        paddingVertical: 3.5,
        paddingHorizontal: 6,
    },
    cellQty: {
        width: '10%',
        textAlign: 'center',
        fontSize: 8,
        paddingVertical: 3.5,
        paddingHorizontal: 4,
    },
    cellAmount: {
        width: '16%',
        textAlign: 'right',
        fontSize: 8,
        fontWeight: 'bold',
        paddingVertical: 3.5,
        paddingHorizontal: 6,
    },

    // Out of stock alert
    oosSection: {
        backgroundColor: '#FEF2F2',
        borderWidth: 1,
        borderColor: '#FECACA',
        borderRadius: 4,
        padding: 5,
        marginBottom: 8,
    },
    oosTitle: {
        fontSize: 7.5,
        fontWeight: 'bold',
        color: '#B91C1C',
        textTransform: 'uppercase',
        marginBottom: 2,
    },
    oosItem: {
        fontSize: 7,
        color: '#7F1D1D',
    },

    // Bottom Calculation Section
    calcSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 2,
        marginBottom: 10,
    },
    wordsCol: {
        width: '54%',
        paddingRight: 10,
        justifyContent: 'flex-start',
    },
    wordsBox: {
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 5,
        padding: 7,
        marginBottom: 6,
    },
    wordsLabel: {
        fontSize: 7,
        fontWeight: 'bold',
        color: '#64748B',
        textTransform: 'uppercase',
        marginBottom: 2,
    },
    wordsText: {
        fontSize: 8,
        fontWeight: 'bold',
        color: '#0A1F5C',
    },
    termsBox: {
        paddingTop: 2,
    },
    termsHeading: {
        fontSize: 7.5,
        fontWeight: 'bold',
        color: '#334155',
        marginBottom: 2,
        textTransform: 'uppercase',
    },
    termsLine: {
        fontSize: 6.8,
        color: '#64748B',
        lineHeight: 1.25,
        marginBottom: 1,
    },

    totalsCol: {
        width: '44%',
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 5,
        padding: 7,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 2,
    },
    totalLabel: {
        fontSize: 8,
        color: '#475569',
    },
    totalValue: {
        fontSize: 8,
        fontWeight: 'bold',
        color: '#1E293B',
    },
    discountLabel: {
        fontSize: 8,
        color: '#15803D',
        fontWeight: 'bold',
    },
    discountValue: {
        fontSize: 8,
        fontWeight: 'bold',
        color: '#15803D',
    },
    divider: {
        borderTopWidth: 1,
        borderTopColor: '#CBD5E1',
        marginVertical: 3,
    },
    grandTotalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#0A1F5C',
        paddingVertical: 5,
        paddingHorizontal: 7,
        borderRadius: 4,
        marginTop: 2,
    },
    grandTotalLabel: {
        fontSize: 9,
        fontWeight: 'bold',
        color: '#FFFFFF',
        textTransform: 'uppercase',
    },
    grandTotalValue: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },

    // Signatory Row
    signatoryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
        paddingTop: 8,
        marginTop: 'auto',
    },
    jurisdictionNote: {
        width: '55%',
        fontSize: 7,
        color: '#64748B',
        lineHeight: 1.3,
    },
    signatoryBlock: {
        width: '40%',
        alignItems: 'center',
    },
    signCompany: {
        fontSize: 8,
        fontWeight: 'bold',
        color: '#0A1F5C',
        textTransform: 'uppercase',
        marginBottom: 24,
        textAlign: 'center',
    },
    signLine: {
        borderTopWidth: 1,
        borderTopColor: '#475569',
        width: '80%',
        textAlign: 'center',
        paddingTop: 2,
        fontSize: 7,
        color: '#475569',
    },

    // Page Footer
    footer: {
        marginTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
        paddingTop: 5,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    footerContact: {
        fontSize: 6.8,
        color: '#64748B',
    },
    footerWebsite: {
        fontSize: 7,
        fontWeight: 'bold',
        color: '#0A1F5C',
    },
});

interface InvoiceProps {
    order: any;
}

export default function InvoicePDF({ order }: InvoiceProps) {
    const items = order.order_items || [];

    // Filter fulfilled items
    const fulfilledItems = items.filter((item: any) => {
        const isAvailable = item.is_available !== false;
        const fulfilledQty = item.fulfilled_quantity !== undefined && item.fulfilled_quantity !== null
            ? item.fulfilled_quantity
            : item.quantity;
        return isAvailable && Number(fulfilledQty) > 0;
    });

    // Compute out of stock items
    const outOfStockItems: Array<{ name: string; qty: number; reason?: string }> = [];
    items.forEach((item: any) => {
        const productDetails = allProducts.find(p => p.id === item.product_id || p.slug === item.product_id) || item.product;
        const name = productDetails?.name || item.product_name || item.product_id || 'Item';
        const isAvailable = item.is_available !== false;
        const fulfilledQty = item.fulfilled_quantity !== undefined && item.fulfilled_quantity !== null
            ? item.fulfilled_quantity
            : item.quantity;

        if (!isAvailable) {
            outOfStockItems.push({
                name,
                qty: item.quantity,
                reason: item.out_of_stock_reason || 'Out of stock'
            });
        } else if (fulfilledQty < item.quantity) {
            outOfStockItems.push({
                name,
                qty: item.quantity - fulfilledQty,
                reason: 'Out of stock'
            });
        }
    });

    const isPaid = (order.payment_status || '').toLowerCase() === 'paid';
    const totalPaid = Number(order.total_amount || 0);
    const couponDiscount = Number(order.discount_amount || 0);
    const loyaltyDiscount = Number(order.loyalty_discount_amount || 0);
    const loyaltyPoints = Number(order.loyalty_points_redeemed || 0);
    const grossSubtotal = totalPaid + couponDiscount + loyaltyDiscount;

    const formattedDate = order.created_at
        ? new Date(order.created_at).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        })
        : new Date().toLocaleDateString('en-IN');

    const invoiceNumber = order.order_number
        ? `KT-INV-${String(order.order_number).padStart(5, '0')}`
        : `KT-INV-${(typeof order.id === 'string' ? order.id.slice(0, 8) : '0000').toUpperCase()}`;

    const shippingAddressText = order.shipping_address && typeof order.shipping_address === 'object'
        ? [
            order.shipping_address.address || order.shipping_address.street || '',
            order.shipping_address.city || '',
            order.shipping_address.state || '',
            order.shipping_address.pincode || order.shipping_address.zip || ''
        ].filter(Boolean).join(', ')
        : (typeof order.shipping_address === 'string' ? order.shipping_address : 'Standard Farm Delivery');

    return (
        <Document title={`Tax-Invoice-${invoiceNumber}`} author="Karthik Traders">
            <Page size="A4" style={styles.page}>

                {/* 1. Header Bar: Logo on Top Left + Structured Company Info + Metadata on Right */}
                <View style={styles.headerBar}>
                    <View style={styles.brandContainer}>
                        {/* Top Left: Logo + Company Name & Tagline */}
                        <View style={styles.logoAndTitleRow}>
                            <Image src="/images/logo-small.png" style={styles.topLogo} />
                            <View style={styles.nameAndTaglineCol}>
                                <Text style={styles.brandName}>KARTHIK TRADERS</Text>
                                <Text style={styles.brandTagline}>Aquaculture Equipment & Aeration Specialists</Text>
                            </View>
                        </View>

                        {/* Structured Address & Stacked Customer Support */}
                        <View style={styles.companyDetailsBlock}>
                            <Text style={styles.addressLine}>
                                Shop No. 13, Opp. Madhura Sweets Line, Near MRF Tyres Line,
                            </Text>
                            <Text style={styles.addressLine}>
                                Subedar Pet, Nellore, Andhra Pradesh - 524001
                            </Text>
                            <Text style={styles.supportLine}>
                                Customer Support: +91 86885 66023, +91 91776 57576
                            </Text>
                            <Text style={styles.supportLine}>
                                Email: karthiktrader111@gmail.com
                            </Text>
                            <Text style={styles.gstinLine}>
                                GSTIN: 37AFGPY0727H1Z6
                            </Text>
                        </View>
                    </View>

                    {/* Right: Invoice Metadata */}
                    <View style={styles.metaContainer}>
                        <Text style={styles.taxInvoicePill}>TAX INVOICE</Text>
                        <Text style={styles.copyType}>ORIGINAL FOR RECIPIENT</Text>
                        <Text style={styles.invNumber}>{invoiceNumber}</Text>
                        <Text style={styles.invDate}>Date: {formattedDate}</Text>
                        <View style={isPaid ? styles.paidBadge : styles.pendingBadge}>
                            <Text style={isPaid ? styles.paidBadgeText : styles.pendingBadgeText}>
                                {isPaid ? 'PAID' : 'PAYMENT PENDING'}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* 2. Customer & Delivery Information Card */}
                <View style={styles.customerSection}>
                    <View style={styles.customerCol}>
                        <Text style={styles.sectionHeading}>Billed To / Customer Details</Text>
                        <Text style={styles.customerName}>{order.customer_name || 'Valued Aquaculture Farmer'}</Text>
                        <Text style={styles.customerText}>Mobile: {order.customer_mobile || 'Not specified'}</Text>
                        {order.customer_email && (
                            <Text style={styles.customerText}>Email: {order.customer_email}</Text>
                        )}
                        <Text style={styles.customerText}>State: Andhra Pradesh (37)</Text>
                    </View>

                    <View style={styles.customerCol}>
                        <Text style={styles.sectionHeading}>Shipping / Delivery Address</Text>
                        <Text style={styles.customerText}>{shippingAddressText}</Text>
                        <Text style={[styles.customerText, { marginTop: 3 }]}>
                            Dispatch From: Nellore Central Warehouse (AP)
                        </Text>
                        <Text style={styles.customerText}>Mode: Surface Logistics / Express Freight</Text>
                    </View>
                </View>

                {/* 3. Items Table */}
                <View style={styles.table}>
                    <View style={styles.tableHeader}>
                        <Text style={[styles.cellSno, styles.tableHeaderCell]}>#</Text>
                        <Text style={[styles.cellDesc, styles.tableHeaderCell]}>Description of Goods</Text>
                        <Text style={[styles.cellPrice, styles.tableHeaderCell]}>Rate (₹)</Text>
                        <Text style={[styles.cellQty, styles.tableHeaderCell]}>Qty</Text>
                        <Text style={[styles.cellAmount, styles.tableHeaderCell]}>Amount (₹)</Text>
                    </View>

                    {fulfilledItems.length > 0 ? (
                        fulfilledItems.map((item: any, idx: number) => {
                            const productDetails = allProducts.find(p => p.id === item.product_id || p.slug === item.product_id) || item.product;
                            const price = Number(item.price_at_purchase || 0);
                            const qty = Number(item.fulfilled_quantity !== undefined && item.fulfilled_quantity !== null ? item.fulfilled_quantity : item.quantity);
                            const rowAmount = price * qty;
                            const isEven = idx % 2 === 1;

                            return (
                                <View key={idx} style={[styles.tableRow, isEven ? styles.tableRowEven : {}]}>
                                    <Text style={styles.cellSno}>{idx + 1}</Text>
                                    <Text style={styles.cellDesc}>
                                        {productDetails?.name || item.product_name || item.product_id || 'Aquaculture Equipment'}
                                    </Text>
                                    <Text style={styles.cellPrice}>₹{price.toLocaleString('en-IN')}</Text>
                                    <Text style={styles.cellQty}>{qty}</Text>
                                    <Text style={styles.cellAmount}>₹{rowAmount.toLocaleString('en-IN')}</Text>
                                </View>
                            );
                        })
                    ) : (
                        <View style={styles.tableRow}>
                            <Text style={[styles.cellDesc, { width: '100%', textAlign: 'center', padding: 8 }]}>
                                No items listed
                            </Text>
                        </View>
                    )}
                </View>

                {/* Out of Stock Alert (if applicable) */}
                {order.include_oos_in_invoice && outOfStockItems.length > 0 && (
                    <View style={styles.oosSection}>
                        <Text style={styles.oosTitle}>Out Of Stock / Unfulfilled Items Notice:</Text>
                        {outOfStockItems.map((oosItem, idx) => (
                            <Text key={idx} style={styles.oosItem}>
                                • {oosItem.name} — Qty: {oosItem.qty} ({oosItem.reason})
                            </Text>
                        ))}
                    </View>
                )}

                {/* 4. Amount in Words + Financial Summary */}
                <View style={styles.calcSection}>
                    <View style={styles.wordsCol}>
                        <View style={styles.wordsBox}>
                            <Text style={styles.wordsLabel}>Amount Chargeable (in words):</Text>
                            <Text style={styles.wordsText}>{numberToIndianWords(totalPaid)}</Text>
                        </View>

                        <View style={styles.termsBox}>
                            <Text style={styles.termsHeading}>Terms & Conditions:</Text>
                            <Text style={styles.termsLine}>1. All prices are inclusive of applicable GST (CGST + SGST).</Text>
                            <Text style={styles.termsLine}>2. Warranty on aerators, motors, and gearboxes is per manufacturer terms.</Text>
                            <Text style={styles.termsLine}>3. Goods once delivered in good condition cannot be returned.</Text>
                            <Text style={styles.termsLine}>4. Any transit damages must be notified within 24 hours of receipt.</Text>
                            <Text style={styles.termsLine}>5. Subject to Nellore, Andhra Pradesh jurisdiction.</Text>
                        </View>
                    </View>

                    <View style={styles.totalsCol}>
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>Subtotal (MRP/Gross):</Text>
                            <Text style={styles.totalValue}>₹{grossSubtotal.toLocaleString('en-IN')}</Text>
                        </View>

                        {couponDiscount > 0 && (
                            <View style={styles.totalRow}>
                                <Text style={styles.discountLabel}>
                                    Coupon Discount ({order.coupon_code || 'PROMO'}):
                                </Text>
                                <Text style={styles.discountValue}>− ₹{couponDiscount.toLocaleString('en-IN')}</Text>
                            </View>
                        )}

                        {loyaltyDiscount > 0 && (
                            <View style={styles.totalRow}>
                                <Text style={styles.discountLabel}>
                                    Loyalty Rewards ({loyaltyPoints.toLocaleString()} pts):
                                </Text>
                                <Text style={styles.discountValue}>− ₹{loyaltyDiscount.toLocaleString('en-IN')}</Text>
                            </View>
                        )}

                        <View style={styles.totalRow}>
                            <Text style={[styles.totalLabel, { fontSize: 7.5 }]}>GST (Taxes Included):</Text>
                            <Text style={[styles.totalValue, { fontSize: 7.5, color: '#64748B' }]}>Included in Price</Text>
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.grandTotalRow}>
                            <Text style={styles.grandTotalLabel}>Net Amount Payable:</Text>
                            <Text style={styles.grandTotalValue}>₹{totalPaid.toLocaleString('en-IN')}</Text>
                        </View>
                    </View>
                </View>

                {/* 5. Signatory & Jurisdiction */}
                <View style={styles.signatoryRow}>
                    <Text style={styles.jurisdictionNote}>
                        This is a computer-generated tax invoice issued by Karthik Traders, Nellore. Valid without signature under IT Act 2000.
                    </Text>

                    <View style={styles.signatoryBlock}>
                        <Text style={styles.signCompany}>For KARTHIK TRADERS</Text>
                        <Text style={styles.signLine}>Authorized Signatory</Text>
                    </View>
                </View>

                {/* 6. Footer */}
                <View style={styles.footer}>
                    <Text style={styles.footerContact}>
                        Head Office: Nellore, AP | Support: +91 86885 66023 | GSTIN: 37AFGPY0727H1Z6
                    </Text>
                    <Text style={styles.footerWebsite}>www.karthiktraders.in</Text>
                </View>

            </Page>
        </Document>
    );
}
