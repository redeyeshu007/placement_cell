import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Student from '@/models/Student';

const LEETCODE_GRAPHQL_URL = 'https://leetcode.com/graphql';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const forceRefresh = searchParams.get('refresh') === 'true';

    await dbConnect();

    // 1. Check Cache
    // Important: tie the cache to BOTH the student AND their current leetcodeUsername.
    // Without this, a student who changes their username still receives the OLD stats
    // because they remain on the student record labelled with the new username.
    if (!forceRefresh) {
      const cacheFilter = studentId
        ? { id: studentId, leetcodeUsername: username }
        : { leetcodeUsername: username };
      const cachedStudent = await Student.findOne(cacheFilter);
      if (cachedStudent && cachedStudent.leetcodeLastSync && cachedStudent.leetcodeUsername === username) {
        const hoursSinceSync = (Date.now() - new Date(cachedStudent.leetcodeLastSync).getTime()) / (1000 * 60 * 60);
        if (hoursSinceSync < 12) {
          return NextResponse.json({
            status: "success",
            totalSolved: cachedStudent.leetcodeSolved,
            easySolved: cachedStudent.leetcodeEasy,
            mediumSolved: cachedStudent.leetcodeMedium,
            hardSolved: cachedStudent.leetcodeHard,
            ranking: cachedStudent.leetcodeRanking,
            cached: true,
            lastSync: cachedStudent.leetcodeLastSync
          });
        }
      }
    }

    // 2. Fetch Fresh Data (GraphQL)
    const query = `
      query userProblemsSolved($username: String!) {
        matchedUser(username: $username) {
          submitStatsGlobal {
            acSubmissionNum {
              difficulty
              count
            }
          }
          profile {
            ranking
          }
        }
      }
    `;

    const response = await fetch(LEETCODE_GRAPHQL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Referer': 'https://leetcode.com',
      },
      body: JSON.stringify({
        query,
        variables: { username }
      }),
    });

    if (!response.ok) {
      throw new Error(`LeetCode API responded with ${response.status}`);
    }

    const result = await response.json();
    const user = result.data?.matchedUser;

    if (!user) {
      return NextResponse.json({ status: "error", message: "User not found" }, { status: 404 });
    }

    const stats: { difficulty: string; count: number }[] = Array.isArray(user.submitStatsGlobal?.acSubmissionNum)
      ? user.submitStatsGlobal.acSubmissionNum
      : [];
    const find = (d: string) => stats.find(s => s.difficulty === d)?.count ?? 0;
    const data = {
      totalSolved:  find('All'),
      easySolved:   find('Easy'),
      mediumSolved: find('Medium'),
      hardSolved:   find('Hard'),
      ranking: user.profile?.ranking ?? 0,
    };

    // 3. Update Database
    // Always write the username alongside the stats so the record can't drift
    // out of sync when a student edits their LeetCode handle.
    const updateData = {
      leetcodeUsername: username,
      leetcodeSolved: data.totalSolved,
      leetcodeEasy: data.easySolved,
      leetcodeMedium: data.mediumSolved,
      leetcodeHard: data.hardSolved,
      leetcodeRanking: data.ranking,
      leetcodeLastSync: new Date()
    };

    if (studentId) {
      await Student.findOneAndUpdate({ id: studentId }, updateData);
    } else {
      await Student.findOneAndUpdate({ leetcodeUsername: username }, updateData);
    }

    return NextResponse.json({
      status: "success",
      ...data,
      cached: false,
      lastSync: updateData.leetcodeLastSync
    });

  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error("LeetCode Proxy Error:", error);
    return NextResponse.json({ status: "error", message: msg }, { status: 500 });
  }
}
