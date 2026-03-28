'use client';
import { useState, useEffect } from 'react';
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  deleteDoc,
  writeBatch,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Template, Item } from '@/types';

export function useData(userId: string | null) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setTemplates([]);
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const templatesRef = collection(db, 'users', userId, 'templates');
    const itemsRef = collection(db, 'users', userId, 'items');

    const unsubTemplates = onSnapshot(
      query(templatesRef, orderBy('sortOrder', 'asc')),
      (snapshot) => {
        const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Template));
        setTemplates(data);
      },
      (err) => {
        // fallback without orderBy if index not ready
        console.error('Templates snapshot error:', err);
        onSnapshot(templatesRef, (snapshot) => {
          const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Template));
          setTemplates(data.sort((a, b) => (a.sortOrder ?? a.createdAt) - (b.sortOrder ?? b.createdAt)));
        });
      }
    );

    const unsubItems = onSnapshot(
      query(itemsRef, orderBy('sortOrder', 'asc')),
      (snapshot) => {
        const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Item));
        setItems(data);
        setLoading(false);
      },
      (err) => {
        console.error('Items snapshot error:', err);
        onSnapshot(itemsRef, (snapshot) => {
          const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Item));
          setItems(data.sort((a, b) => (a.sortOrder ?? a.createdAt) - (b.sortOrder ?? b.createdAt)));
          setLoading(false);
        });
      }
    );

    return () => {
      unsubTemplates();
      unsubItems();
    };
  }, [userId]);

  const saveTemplate = async (template: Template) => {
    if (!userId) return;
    const ref = doc(db, 'users', userId, 'templates', template.id);
    await setDoc(ref, template);
  };

  const deleteTemplate = async (templateId: string) => {
    if (!userId) return;
    const batch = writeBatch(db);
    const templateRef = doc(db, 'users', userId, 'templates', templateId);
    batch.delete(templateRef);
    // Delete all items belonging to this template
    const relatedItems = items.filter((i) => i.templateId === templateId);
    for (const item of relatedItems) {
      const itemRef = doc(db, 'users', userId, 'items', item.id);
      batch.delete(itemRef);
    }
    await batch.commit();
  };

  const saveItem = async (item: Item) => {
    if (!userId) return;
    const ref = doc(db, 'users', userId, 'items', item.id);
    await setDoc(ref, item);
  };

  const deleteItem = async (itemId: string) => {
    if (!userId) return;
    const ref = doc(db, 'users', userId, 'items', itemId);
    await deleteDoc(ref);
  };

  const updateQuantity = async (itemId: string, delta: number) => {
    if (!userId) return;
    const item = items.find((i) => i.id === itemId);
    if (!item) return;
    const newQty = Math.max(0, item.quantity + delta);
    const ref = doc(db, 'users', userId, 'items', itemId);
    await setDoc(ref, { ...item, quantity: newQty, updatedAt: Date.now() });
  };

  const reorderItems = async (reordered: Item[]) => {
    if (!userId) return;
    const batch = writeBatch(db);
    reordered.forEach((item, index) => {
      const ref = doc(db, 'users', userId, 'items', item.id);
      batch.set(ref, { ...item, sortOrder: index });
    });
    await batch.commit();
  };

  const reorderTemplates = async (reordered: Template[]) => {
    if (!userId) return;
    const batch = writeBatch(db);
    reordered.forEach((template, index) => {
      const ref = doc(db, 'users', userId, 'templates', template.id);
      batch.set(ref, { ...template, sortOrder: index });
    });
    await batch.commit();
  };

  const deleteAllData = async () => {
    if (!userId) return;
    const batch = writeBatch(db);
    for (const item of items) {
      batch.delete(doc(db, 'users', userId, 'items', item.id));
    }
    for (const template of templates) {
      batch.delete(doc(db, 'users', userId, 'templates', template.id));
    }
    await batch.commit();
  };

  return {
    templates,
    items,
    loading,
    saveTemplate,
    deleteTemplate,
    saveItem,
    deleteItem,
    updateQuantity,
    reorderItems,
    reorderTemplates,
    deleteAllData,
  };
}
