import React, { useState } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  FlatList, Image, StyleSheet, Dimensions, StatusBar, SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const COLORS = {
  primary: '#1B8B3B', gold: '#C9A84C', white: '#FFFFFF',
  bg: '#F8F9FA', dark: '#1e293b', gray: '#64748b', lightGray: '#e2e8f0',
};

const CATEGORIES = [
  { id: '1', icon: '📱', label: 'Téléphones', bg: '#EFF6FF' },
  { id: '2', icon: '💻', label: 'Informatique', bg: '#F5F3FF' },
  { id: '3', icon: '🚗', label: 'Véhicules', bg: '#FFFBEB' },
  { id: '4', icon: '🏠', label: 'Immobilier', bg: '#ECFDF5' },
  { id: '5', icon: '💼', label: 'Emplois', bg: '#F0F9FF' },
  { id: '6', icon: '🍽️', label: 'Restaurants', bg: '#FEF2F2' },
  { id: '7', icon: '🏨', label: 'Hôtels', bg: '#FAF5FF' },
  { id: '8', icon: '👗', label: 'Mode', bg: '#FFF0F6' },
];

const MOCK_ANNONCES = [
  { id: '1', title: 'iPhone 14 Pro - 256Go', price: 12000000, city: 'Conakry', image: 'https://via.placeholder.com/200', category: '📱', timeAgo: 'Il y a 2h' },
  { id: '2', title: 'Toyota Corolla 2020', price: 85000000, city: 'Conakry', image: 'https://via.placeholder.com/200', category: '🚗', timeAgo: 'Il y a 5h' },
  { id: '3', title: 'Appartement F3 - Kaloum', price: 3500000, city: 'Conakry', image: 'https://via.placeholder.com/200', category: '🏠', timeAgo: 'Il y a 1j' },
  { id: '4', title: 'MacBook Pro M2', price: 22000000, city: 'Labé', image: 'https://via.placeholder.com/200', category: '💻', timeAgo: 'Il y a 3h' },
];

export default function HomeScreen() {
  const [search, setSearch] = useState('');
  const [city, setCity] = useState('Conakry');

  const AnnonceCard = ({ item }: { item: typeof MOCK_ANNONCES[0] }) => (
    <TouchableOpacity style={styles.annonceCard}>
      <Image source={{ uri: item.image }} style={styles.annonceImage} />
      <View style={styles.annonceInfo}>
        <Text style={styles.annonceTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.annoncePrice}>{item.price.toLocaleString('fr-FR')} GNF</Text>
        <View style={styles.annonceMeta}>
          <Text style={styles.annonceMetaText}>📍 {item.city}</Text>
          <Text style={styles.annonceMetaText}>{item.timeAgo}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.logo}>TrouveTout<Text style={styles.logoGold}>224</Text></Text>
              <TouchableOpacity style={styles.citySelector}>
                <Ionicons name="location-outline" size={14} color="rgba(255,255,255,0.8)" />
                <Text style={styles.cityText}>{city}</Text>
                <Ionicons name="chevron-down" size={12} color="rgba(255,255,255,0.8)" />
              </TouchableOpacity>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.iconBtn}>
                <Ionicons name="notifications-outline" size={22} color="white" />
                <View style={styles.notifBadge} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconBtn}>
                <Ionicons name="chatbubble-outline" size={22} color="white" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Search */}
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={18} color={COLORS.gray} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Que cherchez-vous ?"
              placeholderTextColor={COLORS.gray}
              style={styles.searchInput}
            />
          </View>
        </View>

        {/* Publier CTA */}
        <View style={styles.publishCta}>
          <TouchableOpacity style={styles.publishBtn}>
            <Ionicons name="add-circle-outline" size={20} color="white" />
            <Text style={styles.publishBtnText}>Publier une annonce</Text>
          </TouchableOpacity>
        </View>

        {/* Catégories */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Catégories</Text>
            <TouchableOpacity><Text style={styles.seeAll}>Voir tout</Text></TouchableOpacity>
          </View>
          <FlatList
            data={CATEGORIES}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={i => i.id}
            contentContainerStyle={styles.categoriesList}
            renderItem={({ item }) => (
              <TouchableOpacity style={[styles.categoryItem, { backgroundColor: item.bg }]}>
                <Text style={styles.categoryIcon}>{item.icon}</Text>
                <Text style={styles.categoryLabel}>{item.label}</Text>
              </TouchableOpacity>
            )}
          />
        </View>

        {/* Annonces récentes */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🆕 Annonces récentes</Text>
            <TouchableOpacity><Text style={styles.seeAll}>Voir tout</Text></TouchableOpacity>
          </View>
          <FlatList
            data={MOCK_ANNONCES}
            numColumns={2}
            scrollEnabled={false}
            keyExtractor={i => i.id}
            columnWrapperStyle={{ gap: 12 }}
            contentContainerStyle={{ gap: 12, paddingHorizontal: 16 }}
            renderItem={({ item }) => <AnnonceCard item={item} />}
          />
        </View>

        {/* Premium Banner */}
        <View style={styles.premiumBanner}>
          <Text style={styles.premiumTitle}>💎 Pack Premium</Text>
          <Text style={styles.premiumSubtitle}>10 000 GNF = 5 annonces supplémentaires</Text>
          <View style={styles.premiumPayments}>
            <View style={styles.paymentBadge}><Text style={styles.paymentText}>📱 Orange Money</Text></View>
            <View style={styles.paymentBadge}><Text style={styles.paymentText}>💳 Wave</Text></View>
          </View>
          <TouchableOpacity style={styles.premiumBtn}>
            <Text style={styles.premiumBtnText}>Obtenir le Pack →</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Bottom Tab Bar */}
      <View style={styles.tabBar}>
        {[
          { icon: 'home', label: 'Accueil', active: true },
          { icon: 'search', label: 'Recherche', active: false },
          { icon: 'add-circle', label: 'Publier', active: false },
          { icon: 'chatbubbles-outline', label: 'Messages', active: false },
          { icon: 'person-outline', label: 'Profil', active: false },
        ].map((tab, i) => (
          <TouchableOpacity key={i} style={styles.tabItem}>
            {tab.label === 'Publier' ? (
              <View style={styles.tabPublish}>
                <Ionicons name={tab.icon as any} size={32} color="white" />
              </View>
            ) : (
              <>
                <Ionicons name={tab.icon as any} size={24} color={tab.active ? COLORS.primary : COLORS.gray} />
                <Text style={[styles.tabLabel, tab.active && { color: COLORS.primary }]}>{tab.label}</Text>
              </>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { backgroundColor: COLORS.primary, padding: 16, paddingBottom: 24 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  logo: { fontSize: 22, fontWeight: '800', color: 'white' },
  logoGold: { color: COLORS.gold },
  citySelector: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  cityText: { color: 'rgba(255,255,255,0.8)', fontSize: 12 },
  headerActions: { flexDirection: 'row', gap: 8 },
  iconBtn: { width: 38, height: 38, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  notifBadge: { position: 'absolute', top: 6, right: 6, width: 8, height: 8, backgroundColor: '#ef4444', borderRadius: 4 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, gap: 10 },
  searchInput: { flex: 1, fontSize: 14, color: COLORS.dark },
  publishCta: { paddingHorizontal: 16, paddingVertical: 12 },
  publishBtn: { backgroundColor: COLORS.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 14 },
  publishBtnText: { color: 'white', fontWeight: '700', fontSize: 15 },
  section: { marginBottom: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 12 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: COLORS.dark },
  seeAll: { fontSize: 13, color: COLORS.primary, fontWeight: '600' },
  categoriesList: { paddingHorizontal: 16, gap: 10 },
  categoryItem: { alignItems: 'center', padding: 12, borderRadius: 14, width: 80 },
  categoryIcon: { fontSize: 28, marginBottom: 4 },
  categoryLabel: { fontSize: 10, fontWeight: '600', color: COLORS.dark, textAlign: 'center' },
  annonceCard: { flex: 1, backgroundColor: 'white', borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  annonceImage: { width: '100%', height: 120, backgroundColor: COLORS.lightGray },
  annonceInfo: { padding: 10 },
  annonceTitle: { fontSize: 13, fontWeight: '600', color: COLORS.dark, marginBottom: 4 },
  annoncePrice: { fontSize: 14, fontWeight: '800', color: COLORS.primary, marginBottom: 4 },
  annonceMeta: { flexDirection: 'row', justifyContent: 'space-between' },
  annonceMetaText: { fontSize: 10, color: COLORS.gray },
  premiumBanner: { marginHorizontal: 16, backgroundColor: COLORS.primary, borderRadius: 20, padding: 20, marginBottom: 16 },
  premiumTitle: { fontSize: 20, fontWeight: '800', color: 'white', marginBottom: 4 },
  premiumSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginBottom: 12 },
  premiumPayments: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  paymentBadge: { backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  paymentText: { color: 'white', fontSize: 11, fontWeight: '600' },
  premiumBtn: { backgroundColor: COLORS.gold, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  premiumBtnText: { color: 'white', fontWeight: '700', fontSize: 14 },
  tabBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'white', flexDirection: 'row', paddingBottom: 20, paddingTop: 10, borderTopWidth: 1, borderTopColor: COLORS.lightGray, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.06, elevation: 10 },
  tabItem: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2 },
  tabPublish: { width: 52, height: 52, backgroundColor: COLORS.primary, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: -24, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, elevation: 8 },
  tabLabel: { fontSize: 10, color: COLORS.gray, fontWeight: '500' },
});
