import React, { useState } from 'react';
import { View, ScrollView, Dimensions } from 'react-native';
import { useTheme } from '@/theme';

const SCREEN_WIDTH = Dimensions.get('window').width;

type PagedSectionsProps = {
  children: React.ReactNode[];
};

export function PagedSections({ children }: PagedSectionsProps) {
  const { colors } = useTheme();
  const [activePage, setActivePage] = useState(0);
  const pageCount = React.Children.count(children);

  return (
    <>
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, paddingVertical: 12 }}>
        {Array.from({ length: pageCount }, (_, i) => (
          <View
            key={i}
            style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: activePage === i ? colors.cream : colors.ink4,
              opacity: activePage === i ? 1 : 0.3,
            }}
          />
        ))}
      </View>

      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={e => {
          const page = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
          setActivePage(page);
        }}
        style={{ flex: 1 }}
      >
        {React.Children.map(children, child => (
          <View style={{ width: SCREEN_WIDTH }}>{child}</View>
        ))}
      </ScrollView>
    </>
  );
}
