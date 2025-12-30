import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { Token, TokenStatus } from "@/lib/types";

const COLUMNS = 3;
const ROWS_PER_PAGE = 11;
const TOKENS_PER_PAGE = COLUMNS * ROWS_PER_PAGE;

const PAGE_PADDING_X = 32;
const PAGE_PADDING_TOP = 26;
const PAGE_PADDING_BOTTOM = 54;

const styles = StyleSheet.create({
  page: {
    paddingTop: PAGE_PADDING_TOP,
    paddingBottom: PAGE_PADDING_BOTTOM,
    paddingHorizontal: PAGE_PADDING_X,
    fontFamily: "Helvetica",
    fontSize: 10
  },
  header: {
    marginBottom: 12,
    textAlign: "center"
  },
  headerTitle: {
    fontSize: 12,
    fontWeight: "bold",
    letterSpacing: 2
  },
  headerSub: {
    fontSize: 10,
    marginTop: 4
  },
  headerMeta: {
    fontSize: 9,
    marginTop: 2,
    color: "#475569"
  },
  headerBatch: {
    fontSize: 9,
    marginTop: 2
  },
  headerRight: {
    position: "absolute",
    right: PAGE_PADDING_X,
    top: PAGE_PADDING_TOP,
    fontSize: 9,
    color: "#64748B"
  },

  grid: {
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -4
  },
  card: {
    width: `${100 / COLUMNS}%`,
    paddingHorizontal: 4,
    marginBottom: 7
  },
  cardInner: {
    borderWidth: 0.7,
    borderColor: "#CBD5E1",
    borderRadius: 6,
    paddingVertical: 7,
    paddingHorizontal: 6,
    backgroundColor: "#F8FAFC",
    textAlign: "center"
  },
  token: {
    fontSize: 11,
    fontWeight: "bold",
    letterSpacing: 3.5,
    marginBottom: 3
  },
  small: {
    fontSize: 8,
    color: "#64748B"
  },
  smallBold: {
    fontSize: 8,
    color: "#475569",
    fontWeight: "bold"
  },

  footer: {
    position: "absolute",
    left: PAGE_PADDING_X,
    right: PAGE_PADDING_X,
    bottom: 22,
    borderTopWidth: 0.5,
    borderTopColor: "#E2E8F0",
    paddingTop: 6,
    fontSize: 8,
    color: "#64748B"
  }
});

type TokenSheetDocumentProps = {
  tokens: Token[];
  electionName: string;
  status: TokenStatus;
  batch?: string | null;
};

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export function TokenSheetDocument(props: TokenSheetDocumentProps) {
  const { tokens, electionName, status, batch } = props;

  const pages = chunk(tokens, TOKENS_PER_PAGE);
  const totalPages = pages.length;

  return (
    <Document>
      {pages.map((pageTokens, idx) => (
        <Page key={idx} size="A4" style={styles.page}>
          <Text style={styles.headerRight}>
            Halaman {idx + 1}/{totalPages}
          </Text>

          <View style={styles.header}>
            <Text style={styles.headerTitle}>TOKEN PEMILIH</Text>
            {electionName ? <Text style={styles.headerSub}>{electionName}</Text> : null}
            <Text style={styles.headerMeta}>Status: {status}</Text>
            {batch ? (
              <Text style={styles.headerBatch}>
                Batch: <Text style={styles.smallBold}>{batch}</Text>
              </Text>
            ) : null}
          </View>

          <View style={styles.grid}>
            {pageTokens.map((t) => (
              <View key={t.id} style={styles.card}>
                <View style={styles.cardInner}>
                  <Text style={styles.token}>{t.token}</Text>
                  {t.generatedBatch ? <Text style={styles.small}>{t.generatedBatch}</Text> : null}
                  <Text style={[styles.small, { marginTop: 2 }]}>
                    Token hanya dapat digunakan satu kali.
                  </Text>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.footer}>
            <Text>
              Simpan lembar ini dengan baik dan bagikan token secara tertib kepada pemilih yang
              berhak.
            </Text>
          </View>
        </Page>
      ))}
    </Document>
  );
}
