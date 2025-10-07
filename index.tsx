import React, { useState, useEffect } from 'react';
import {
    SafeAreaView,
    View,
    Text,
    FlatList,
    StyleSheet,
    Pressable,
    Modal,
    TextInput,
    TouchableOpacity,
    StatusBar
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type StatusType = 'Created' | 'Under Assistance' | 'Completed';

interface Ticket {
    id: string;
    title: string;
    description: string;
    status: StatusType;
    rating: number | null;
}

interface StatusBadgeProps {
    status: StatusType;
}

interface TicketItemProps {
    ticket: Ticket;
    onEdit: (ticket: Ticket) => void;
    onDelete: (id: string) => void;
    onSetRating: (id: string, rating: number) => void;
}

const STATUS_COLORS: Record<StatusType, string> = {
    Created: '#3b82f6',
    'Under Assistance': '#f59e0b',
    Completed: '#10b981',
};

function StatusBadge({ status }: StatusBadgeProps) {
    return (
        <View style={[styles.badge, { backgroundColor: STATUS_COLORS[status] || '#9ca3af' }]}>
            <Text style={styles.badgeText}>{status}</Text>
        </View>
    );
}

function TicketItem({ ticket, onEdit, onDelete, onSetRating }: TicketItemProps) {
    return (
        <View style={styles.ticket}>
            <View style={{ flex: 1 }}>
                <Text style={styles.title}>{ticket.title}</Text>
                <Text style={styles.desc} numberOfLines={2}>{ticket.description}</Text>
            </View>

            <View style={styles.rightCol}>
                <StatusBadge status={ticket.status} />

                {ticket.status === 'Completed' && (
                    <View style={styles.ratingRow}>
                        <Text style={styles.ratingLabel}>Rating:</Text>
                        <View style={styles.stars}>
                            {[1, 2, 3, 4, 5].map((n) => (
                                <TouchableOpacity key={n} onPress={() => onSetRating(ticket.id, n)} activeOpacity={0.7}>
                                    <Text style={n <= (ticket.rating || 0) ? styles.starOn : styles.starOff}>★</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                )}

                <View style={styles.actions}>
                    <Pressable onPress={() => onEdit(ticket)} style={styles.actionBtn}><Text>Edit</Text></Pressable>
                    <Pressable onPress={() => onDelete(ticket.id)} style={[styles.actionBtn, { marginLeft: 8 }]}><Text>Delete</Text></Pressable>
                </View>
            </View>
        </View>
    );
}

export default function App() {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [selectedStatus, setSelectedStatus] = useState<StatusType>('Created');
    const [isEdit, setIsEdit] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);

    useEffect(() => {
        loadTickets();
    }, []);

    const loadTickets = async () => {
        try {
            const json = await AsyncStorage.getItem('tickets');
            if (json) setTickets(JSON.parse(json));
        } catch (e) {
            console.error('Failed to load tickets:', e);
        }
    };

    const saveTickets = async (data: Ticket[]) => {
        try {
            await AsyncStorage.setItem('tickets', JSON.stringify(data));
        } catch (e) {
            console.error('Failed to save tickets:', e);
        }
    };

    const updateTickets = (newList: Ticket[]) => {
        setTickets(newList);
        saveTickets(newList);
    };

    const openAdd = () => {
        setTitle('');
        setDescription('');
        setSelectedStatus('Created');
        setIsEdit(false);
        setEditId(null);
        setModalVisible(true);
    };

    const handleSave = () => {
        if (!title.trim()) {
            alert('Please enter a title.');
            return;
        }

        let updated: Ticket[] = [];

        if (isEdit && editId) {
            updated = tickets.map((t) =>
                t.id === editId ? { ...t, title, description, status: selectedStatus } : t
            );
        } else {
            const newTicket: Ticket = {
                id: Date.now().toString(),
                title,
                description,
                status: selectedStatus,
                rating: null
            };
            updated = [newTicket, ...tickets];
        }

        updateTickets(updated);
        setModalVisible(false);
    };

    const handleEdit = (ticket: Ticket) => {
        setTitle(ticket.title);
        setDescription(ticket.description);
        setSelectedStatus(ticket.status);
        setIsEdit(true);
        setEditId(ticket.id);
        setModalVisible(true);
    };

    const handleDelete = (id: string) => {
        const updated = tickets.filter((t) => t.id !== id);
        updateTickets(updated);
    };

    const handleSetRating = (id: string, rating: number) => {
        const updated = tickets.map((t) => (t.id === id ? { ...t, rating } : t));
        updateTickets(updated);
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <Text style={styles.header}>Ticket Tracker</Text>

            <FlatList
                data={tickets}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <TicketItem ticket={item} onEdit={handleEdit} onDelete={handleDelete} onSetRating={handleSetRating} />
                )}
                contentContainerStyle={{ padding: 16 }}
                ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 20 }}>No tickets yet</Text>}
            />

            <Pressable style={styles.addButton} onPress={openAdd}>
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>+ Add Ticket</Text>
            </Pressable>

            <Modal visible={modalVisible} animationType="slide" transparent>
                <View style={styles.modalBackdrop}>
                    <View style={styles.modal}>
                        <Text style={styles.modalTitle}>{isEdit ? 'Edit Ticket' : 'New Ticket'}</Text>

                        <TextInput placeholder="Title" value={title} onChangeText={setTitle} style={styles.input} />
                        <TextInput placeholder="Description" value={description} onChangeText={setDescription} style={[styles.input, { height: 80 }]} multiline />

                        <Text style={{ marginTop: 8 }}>Status</Text>
                        <View style={{ flexDirection: 'row', marginTop: 8 }}>
                            {['Created', 'Under Assistance', 'Completed'].map((s) => (
                                <Pressable
                                    key={s}
                                    onPress={() => setSelectedStatus(s as StatusType)}
                                    style={[styles.statusOption, selectedStatus === s && styles.statusOptionSelected]}
                                >
                                    <Text style={selectedStatus === s ? { color: '#fff' } : {}}>{s}</Text>
                                </Pressable>
                            ))}
                        </View>

                        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16 }}>
                            <Pressable onPress={() => setModalVisible(false)} style={[styles.modalBtn, { marginRight: 8 }]}>
                                <Text>Cancel</Text>
                            </Pressable>
                            <Pressable onPress={handleSave} style={[styles.modalBtn, { backgroundColor: '#3b82f6' }]}>
                                <Text style={{ color: '#fff' }}>Save</Text>
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    header: { fontSize: 22, fontWeight: '700', padding: 16 },
    ticket: { flexDirection: 'row', padding: 12, backgroundColor: '#f9fafb', borderRadius: 8, marginBottom: 12 },
    title: { fontWeight: '700', fontSize: 16 },
    desc: { color: '#374151', marginTop: 4 },
    rightCol: { width: 140, alignItems: 'flex-end', justifyContent: 'space-between' },
    badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
    badgeText: { color: '#fff', fontSize: 12, fontWeight: '600' },
    actions: { flexDirection: 'row', marginTop: 8 },
    actionBtn: { padding: 6, backgroundColor: '#e5e7eb', borderRadius: 6 },
    addButton: { position: 'absolute', right: 16, bottom: 24, backgroundColor: '#111827', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 24, elevation: 4 },
    modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 16 },
    modal: { backgroundColor: '#fff', borderRadius: 8, padding: 16 },
    modalTitle: { fontSize: 18, fontWeight: '700' },
    input: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, padding: 8, marginTop: 8 },
    statusOption: { padding: 8, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 6, marginRight: 8 },
    statusOptionSelected: { backgroundColor: '#111827', borderColor: '#111827' },
    modalBtn: { padding: 10, borderRadius: 6, backgroundColor: '#e5e7eb' },
    stars: { flexDirection: 'row', marginLeft: 6 },
    starOn: { fontSize: 18, color: '#f59e0b', marginHorizontal: 2 },
    starOff: { fontSize: 18, color: '#d1d5db', marginHorizontal: 2 },
    ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
    ratingLabel: { fontSize: 12, color: '#374151' },
});
